import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";
import { z } from "zod";

import {
  assertStudentAccess,
  protectedProcedure,
  router,
  studentProcedure,
} from "../index";
import {
  addMonthsClamped,
  buildTuitionAndKitRows,
  formatDateForPg,
} from "../lib/payment-schedule";

const studentIdInput = z.object({ studentId: z.number().int().positive() });

type PaymentStatus = "paid" | "unpaid" | "overdue" | "partially_paid";

type KitRow = {
  amount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  dueDate: string;
};

type KitSummary = {
  amount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  dueDate: string;
};

// Rolls every kit_fee row into one summary for the Kit Details card. Returns
// null when the student has no kit fees. Status precedence: all paid → paid;
// otherwise any overdue → overdue; otherwise any money collected →
// partially_paid; otherwise unpaid. dueDate is the earliest still-owing date
// (falling back to the earliest of all when everything is paid).
function summarizeKit(rows: KitRow[]): KitSummary | null {
  if (rows.length === 0) {
    return null;
  }

  const amount = rows.reduce((sum, row) => sum + row.amount, 0);
  const amountPaid = rows.reduce(
    (sum, row) =>
      sum + (row.paymentStatus === "paid" ? row.amount : row.amountPaid),
    0
  );

  let paymentStatus: PaymentStatus;
  if (rows.every((row) => row.paymentStatus === "paid")) {
    paymentStatus = "paid";
  } else if (rows.some((row) => row.paymentStatus === "overdue")) {
    paymentStatus = "overdue";
  } else if (amountPaid > 0) {
    paymentStatus = "partially_paid";
  } else {
    paymentStatus = "unpaid";
  }

  const owing = rows.filter((row) => row.paymentStatus !== "paid");
  const duePool = owing.length > 0 ? owing : rows;
  // dueDate strings are "YYYY-MM-DD", so lexical min === chronological min.
  const dueDate = duePool
    .map((row) => row.dueDate)
    .reduce((min, date) => (date < min ? date : min));

  return { amount, amountPaid, paymentStatus, dueDate };
}

export const enrollmentRouter = router({
  // Latest enrollment + derived payment progress for the overview cards
  getStudentEnrollment: studentProcedure
    .input(studentIdInput)
    .query(async ({ ctx, input }) => {
      const { studentId } = input;
      assertStudentAccess(ctx, studentId);
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId))
        .orderBy(desc(enrollments.createdAt))
        .limit(1);

      if (!enrollment) {
        return null;
      }

      const enrollmentPayments = await db
        .select({
          amount: payments.amount,
          amountPaid: payments.amountPaid,
          dueDate: payments.dueDate,
          paymentStatus: payments.paymentStatus,
          paymentType: payments.paymentType,
          description: payments.description,
        })
        .from(payments)
        .where(eq(payments.enrollmentId, enrollment.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));

      // Progress counters cover every tuition_fee row — the installment
      // schedule, the initial down-payment, and any ad-hoc tuition payments.
      // Only the kit fee is tracked separately (in its own card).
      const tuitionPayments = enrollmentPayments.filter(
        (p) => p.paymentType === "tuition_fee"
      );
      // Every kit_fee row (the enrollment kit plus any ad-hoc kit payments)
      // rolls up into one summary for the Kit Details card. Identified by
      // payment_type, never by the description string.
      const kitPayments = enrollmentPayments.filter(
        (p) => p.paymentType === "kit_fee"
      );
      const kitSummary = summarizeKit(kitPayments);

      const paidCount = tuitionPayments.filter(
        (p) => p.paymentStatus === "paid"
      ).length;
      // Roll up: full amount for paid rows, partial chunks for in-progress
      // rows. amountPaid tracks each row's running total (0 when untouched,
      // == amount when fully paid).
      const totalPaid = tuitionPayments.reduce(
        (sum, p) =>
          sum + (p.paymentStatus === "paid" ? p.amount : (p.amountPaid ?? 0)),
        0
      );
      // Denominator for the progress ring: the sum of every tuition_fee row
      // (installments + initial + ad-hoc), so ad-hoc tuition is reflected in
      // the total — not just enrollment.totalFees, which is fixed at signup.
      const totalDue = tuitionPayments.reduce((sum, p) => sum + p.amount, 0);
      const nextUnpaid = tuitionPayments.find(
        (p) => p.paymentStatus === "unpaid"
      );
      const overduePayments = tuitionPayments.filter(
        (p) => p.paymentStatus === "overdue"
      );
      const oldestOverdue = overduePayments[0];

      // Joining date is locked once a row whose due date is derived from the
      // joining day — a tuition installment or the kit — is paid or overdue
      // (shifting the joining day would rewrite an already-settled due date).
      // The initial deposit is a tuition_fee row but anchors to the admission
      // day, so it must never lock the joining date even when it's paid.
      const joiningAnchoredTuition = tuitionPayments.filter(
        (p) => p.description !== "Initial Payment"
      );
      // A 0-amount "paid" installment (fully covered by the initial deposit)
      // collected no money on its due date, so it must not lock either.
      const isJoiningDateLocked =
        joiningAnchoredTuition.some(
          (p) =>
            (p.paymentStatus === "paid" && p.amount > 0) ||
            p.paymentStatus === "overdue"
        ) ||
        (kitSummary !== null && kitSummary.paymentStatus !== "unpaid");

      return {
        enrollment: {
          id: enrollment.id,
          course: enrollment.course,
          level: enrollment.level,
          duration: enrollment.duration,
          totalFees: enrollment.totalFees,
          paymentPlan: enrollment.paymentPlan,
          emiMonths: enrollment.emiMonths,
          kitProvided: enrollment.kitProvided,
          kitCost: enrollment.kitCost,
          closedBy: enrollment.closedBy,
          admissionDate: enrollment.admissionDate.toISOString(),
          joiningDate: enrollment.joiningDate,
        },
        progress: {
          paidCount,
          totalCount: tuitionPayments.length,
          totalPaid,
          totalDue,
          admissionDate: enrollment.admissionDate.toISOString(),
          joiningDate: enrollment.joiningDate,
          isJoiningDateLocked,
          nextDueDate: nextUnpaid?.dueDate ?? null,
          hasOverdue: overduePayments.length > 0,
          oldestOverdueDate: oldestOverdue?.dueDate ?? null,
        },
        kit: kitSummary,
      };
    }),

  // Sets (first-time) or updates the joining date for an enrollment.
  // Generates tuition + kit rows on first set. On updates, the joining date
  // is locked if any tuition or kit row is already paid or overdue — admin
  // must mark those rows unpaid before changing the date. When unlocked,
  // due dates on all remaining tuition + kit rows are recomputed and the
  // student's status flips from `pending` to `active`.
  setJoiningDate: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive(),
        joiningDate: z.coerce.date(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const [enrollment] = await tx
          .select()
          .from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (!enrollment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Enrollment not found",
          });
        }

        // Strip time so the comparison is day-based; admissionDate is stored
        // as a timestamp but the business rule is "joining day must not
        // precede admission day."
        const admissionDay = new Date(enrollment.admissionDate);
        admissionDay.setHours(0, 0, 0, 0);
        const joiningDay = new Date(input.joiningDate);
        joiningDay.setHours(0, 0, 0, 0);
        if (joiningDay < admissionDay) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Joining date cannot be before admission date",
          });
        }

        // Look at tuition + kit rows (everything but Initial Payment).
        // Tuition rows have a NULL description (only Kit and Initial Payment
        // are tagged). `description != 'Initial Payment'` alone would
        // silently drop the NULL rows because of SQL's three-valued logic,
        // so we explicitly include them via `isNull`.
        const existingRows = await tx
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.enrollmentId, input.enrollmentId),
              or(
                isNull(payments.description),
                ne(payments.description, "Initial Payment")
              )
            )
          );

        // A 0-amount paid tuition row is an installment fully covered by the
        // initial deposit — no money collected on its due date, so no lock.
        const lockedRow = existingRows.find(
          (row) =>
            row.paymentStatus === "overdue" ||
            (row.paymentStatus === "paid" &&
              !(row.paymentType === "tuition_fee" && row.amount === 0))
        );
        if (lockedRow) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Joining date is locked: a tuition or kit payment has already been recorded or is overdue. Mark it unpaid before changing the joining date.",
          });
        }

        const joiningDateString = formatDateForPg(input.joiningDate);

        if (existingRows.length === 0) {
          // First-time set: insert the tuition schedule + kit row.
          const rows = buildTuitionAndKitRows(
            {
              studentId: enrollment.studentId,
              enrollmentId: enrollment.id,
              totalFees: enrollment.totalFees,
              initialPayment: enrollment.initialPayment,
              paymentPlan: enrollment.paymentPlan,
              emiMonths: enrollment.emiMonths,
              kitProvided: enrollment.kitProvided,
              kitCost: enrollment.kitCost,
            },
            input.joiningDate
          );
          if (rows.length > 0) {
            await tx.insert(payments).values(rows);
          }
        } else {
          // Update path: recompute dueDate for each unpaid tuition/kit row.
          // The kit row anchors to joining day; tuition rows are offset by
          // (emiNumber - 1) months. Single-payment plans have a null
          // emiNumber and offset 0.
          for (const row of existingRows) {
            const newDueDate =
              row.paymentType === "kit_fee"
                ? joiningDateString
                : formatDateForPg(
                    addMonthsClamped(
                      input.joiningDate,
                      row.emiNumber ? row.emiNumber - 1 : 0
                    )
                  );
            await tx
              .update(payments)
              .set({ dueDate: newDueDate })
              .where(eq(payments.id, row.id));
          }
        }

        await tx
          .update(enrollments)
          .set({ joiningDate: joiningDateString })
          .where(eq(enrollments.id, input.enrollmentId));

        // A pending student becomes active the moment a joining date exists.
        // We only touch the row when the prior status was pending so an
        // admin's later in_active / discontinue choice isn't clobbered by a
        // subsequent date edit.
        await tx
          .update(students)
          .set({ studentStatus: "active" })
          .where(
            and(
              eq(students.id, enrollment.studentId),
              eq(students.studentStatus, "pending")
            )
          );

        return {
          enrollmentId: input.enrollmentId,
          joiningDate: joiningDateString,
        };
      });
    }),
});
