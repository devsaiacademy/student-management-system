import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import {
  payments,
  type PaymentMetaData,
} from "@student-management-system/db/schema/payment";
import { students } from "@student-management-system/db/schema/students";
import { env } from "@student-management-system/env/server";
import { and, eq, lt, sql } from "drizzle-orm";

import { PaymentOverdueEmail } from "../emails/payment-overdue-email";
import { resend } from "./resend";
import { sendOverdueWhatsApp } from "./whatsapp";

export type MarkOverdueResult = {
  flipped: number;
  penaltiesApplied: number;
  emailsSent: number;
  whatsappsSent: number;
  failures: Array<{ paymentId: number; error: string }>;
};

const PENALTY_INR = 100;
const PENALTY_INTERVAL_DAYS = 7;

type PaymentContext = {
  paymentId: number;
  amount: number;
  penalty: number;
  dueDate: string;
  emiNumber: number | null;
  paymentDescription: string | null;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  course: string;
  notificationCount: number;
};

const REMINDER_INTERVAL_DAYS = 7;

// Adds ₹PENALTY_INR to every overdue row whose last penalty was applied more
// than PENALTY_INTERVAL_DAYS ago (or never). The running total lives at
// `metaData.penalty` and each application is logged as
// `metaData.penaltyLog = [{ at, delta }, ...]`. No cap — penalty grows until
// the row is paid (which flips it out of `overdue` and excludes it from the
// WHERE filter on the next run).
async function applyOverduePenalties(): Promise<number> {
  const entry: PaymentMetaData["penaltyLog"] = [
    { at: new Date().toISOString(), delta: PENALTY_INR },
  ];

  const rows = await db
    .update(payments)
    .set({
      metaData: sql`
        COALESCE(${payments.metaData}, '{}'::jsonb)
        || jsonb_build_object(
          'penalty',
          COALESCE((${payments.metaData}->>'penalty')::int, 0) + ${PENALTY_INR}
        )
        || jsonb_build_object(
          'penaltyLog',
          COALESCE(${payments.metaData}->'penaltyLog', '[]'::jsonb) || ${JSON.stringify(entry)}::jsonb
        )
      `,
    })
    .where(
      and(
        eq(payments.paymentStatus, "overdue"),
        sql`(
          ${payments.metaData}->'penaltyLog' IS NULL
          OR jsonb_array_length(COALESCE(${payments.metaData}->'penaltyLog', '[]'::jsonb)) = 0
          OR (
            (${payments.metaData}->'penaltyLog' -> (jsonb_array_length(${payments.metaData}->'penaltyLog') - 1) ->> 'at')::timestamptz
            < NOW() - (${PENALTY_INTERVAL_DAYS} || ' days')::interval
          )
        )`
      )
    )
    .returning({ paymentId: payments.id });

  return rows.length;
}

async function loadPaymentContext(
  paymentId: number
): Promise<PaymentContext | null> {
  const [row] = await db
    .select({
      paymentId: payments.id,
      amount: payments.amount,
      dueDate: payments.dueDate,
      emiNumber: payments.emiNumber,
      paymentDescription: payments.description,
      studentName: students.name,
      studentEmail: students.email,
      studentPhone: students.phoneNumber,
      course: enrollments.course,
      penalty: sql<number>`COALESCE((${payments.metaData}->>'penalty')::int, 0)`,
      notificationCount: sql<number>`COALESCE((${payments.metaData}->>'overdueNotificationCount')::int, 0)`,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  return row ?? null;
}

type NotificationOutcome = {
  emailStatus: "sent" | "failed";
  whatsappStatus: "sent" | "failed" | "skipped";
  whatsappError?: string;
  notificationCount: number;
};

async function writeNotificationMetadata(
  paymentId: number,
  outcome: NotificationOutcome
): Promise<void> {
  const patch: PaymentMetaData = {
    overdueNotifiedAt: new Date().toISOString(),
    overdueEmailStatus: outcome.emailStatus,
    overdueWhatsappStatus: outcome.whatsappStatus,
    overdueNotificationCount: outcome.notificationCount,
    ...(outcome.whatsappError
      ? { overdueWhatsappError: outcome.whatsappError.slice(0, 500) }
      : {}),
  };

  // Merge into existing jsonb instead of overwriting sibling audit fields.
  await db
    .update(payments)
    .set({
      metaData: sql`COALESCE(${payments.metaData}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb`,
    })
    .where(eq(payments.id, paymentId));
}

async function sendEmail(
  ctx: PaymentContext,
  isOverdue: boolean
): Promise<void> {
  if (!resend) {
    throw new Error("Resend is not configured");
  }
  if (!ctx.studentEmail) {
    throw new Error("Student has no email on file");
  }

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: ctx.studentEmail,
    subject: isOverdue ? "Your payment is overdue" : "Payment reminder",
    react: PaymentOverdueEmail({
      studentName: ctx.studentName,
      amount: ctx.amount,
      penalty: ctx.penalty,
      dueDate: ctx.dueDate,
      course: ctx.course,
      emiNumber: ctx.emiNumber ?? undefined,
      isOverdue,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Sends a reminder/overdue email AND a parallel WhatsApp template message for
// a single payment, recording both outcomes in the payment's jsonb metadata.
// Email is the source-of-truth channel: this function throws if the email send
// fails (so the admin-triggered `sendPaymentReminder` mutation can surface the
// error). WhatsApp is best-effort — its failure is logged into metadata but
// never thrown. The return value lets the cron loop tally successful WhatsApp
// sends; on email failure the WhatsApp result is still persisted to metadata.
export async function sendOverdueEmail(
  paymentId: number
): Promise<{ whatsappOk: boolean }> {
  const ctx = await loadPaymentContext(paymentId);
  if (!ctx) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const today = new Date().toISOString().split("T")[0] ?? "";
  const isOverdue = ctx.dueDate < today;

  let emailError: unknown;
  let emailStatus: "sent" | "failed" = "failed";
  try {
    await sendEmail(ctx, isOverdue);
    emailStatus = "sent";
  } catch (err) {
    emailError = err;
  }

  const whatsapp = await sendOverdueWhatsApp({
    phoneNumber: ctx.studentPhone,
    studentName: ctx.studentName,
    emiNumber: ctx.emiNumber,
    description: ctx.paymentDescription,
    amount: ctx.amount + ctx.penalty,
    course: ctx.course,
  });

  await writeNotificationMetadata(paymentId, {
    emailStatus,
    whatsappStatus: whatsapp.ok ? "sent" : "failed",
    whatsappError: whatsapp.ok ? undefined : whatsapp.error,
    notificationCount: ctx.notificationCount + 1,
  }).catch(() => {
    // Metadata write is best-effort.
  });

  if (emailError) {
    throw emailError;
  }
  return { whatsappOk: whatsapp.ok };
}

export async function markOverduePaymentsAndNotify(): Promise<MarkOverdueResult> {
  // One-statement flip for idempotency — only rows still `unpaid` today get
  // moved to `overdue`, and a second run the same day flips nothing.
  const flipped = await db
    .update(payments)
    .set({ paymentStatus: "overdue" })
    .where(
      and(
        eq(payments.paymentStatus, "unpaid"),
        lt(payments.dueDate, sql`CURRENT_DATE`)
      )
    )
    .returning({ paymentId: payments.id });

  // Run penalty step after the flip so newly-overdue rows pick up their first
  // ₹100 in the same cron run. Notifications below read the updated metaData,
  // so the email/WhatsApp body reflects the just-applied penalty.
  const penaltiesApplied = await applyOverduePenalties();

  // Pick up every overdue row that needs a (re-)notification: those never
  // notified yet (just-flipped rows fall here, since metaData is NULL) AND
  // those already overdue whose last notify was more than the reminder
  // interval ago. Same query covers initial + weekly reminders.
  const dueForNotify = await db
    .select({ paymentId: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.paymentStatus, "overdue"),
        sql`(
          ${payments.metaData}->>'overdueNotifiedAt' IS NULL
          OR (${payments.metaData}->>'overdueNotifiedAt')::timestamptz
             < NOW() - (${REMINDER_INTERVAL_DAYS} || ' days')::interval
        )`
      )
    );

  const result: MarkOverdueResult = {
    flipped: flipped.length,
    penaltiesApplied,
    emailsSent: 0,
    whatsappsSent: 0,
    failures: [],
  };

  for (const { paymentId } of dueForNotify) {
    try {
      const { whatsappOk } = await sendOverdueEmail(paymentId);
      result.emailsSent += 1;
      if (whatsappOk) {
        result.whatsappsSent += 1;
      }
    } catch (err) {
      // Email failed — WhatsApp may still have run; its status is in metadata.
      // Counter undercounts in this branch, which is acceptable for a metric.
      result.failures.push({
        paymentId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
