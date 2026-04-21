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

export type MarkOverdueResult = {
  flipped: number;
  emailsSent: number;
  failures: Array<{ paymentId: number; error: string }>;
};

type PaymentContext = {
  paymentId: number;
  amount: number;
  dueDate: string;
  emiNumber: number | null;
  studentName: string;
  studentEmail: string;
  course: string;
};

async function loadPaymentContext(
  paymentId: number
): Promise<PaymentContext | null> {
  const [row] = await db
    .select({
      paymentId: payments.id,
      amount: payments.amount,
      dueDate: payments.dueDate,
      emiNumber: payments.emiNumber,
      studentName: students.name,
      studentEmail: students.email,
      course: enrollments.course,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  return row ?? null;
}

async function writeNotificationMetadata(
  paymentId: number,
  emailStatus: "sent" | "failed"
): Promise<void> {
  const patch: PaymentMetaData = {
    overdueNotifiedAt: new Date().toISOString(),
    overdueEmailStatus: emailStatus,
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

// Sends a reminder/overdue email for a single payment and records the outcome
// in the payment's jsonb metadata. Throws if the payment is missing or the
// email provider rejects the send. Used by both the cron loop and the
// admin-triggered `sendPaymentReminder` mutation.
export async function sendOverdueEmail(paymentId: number): Promise<void> {
  const ctx = await loadPaymentContext(paymentId);
  if (!ctx) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const today = new Date().toISOString().split("T")[0] ?? "";
  const isOverdue = ctx.dueDate < today;

  try {
    await sendEmail(ctx, isOverdue);
    await writeNotificationMetadata(paymentId, "sent");
  } catch (err) {
    await writeNotificationMetadata(paymentId, "failed").catch(() => {
      // Metadata write is best-effort.
    });
    throw err;
  }
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

  const result: MarkOverdueResult = {
    flipped: flipped.length,
    emailsSent: 0,
    failures: [],
  };

  for (const { paymentId } of flipped) {
    try {
      await sendOverdueEmail(paymentId);
      result.emailsSent += 1;
    } catch (err) {
      result.failures.push({
        paymentId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
