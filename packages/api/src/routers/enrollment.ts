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
          description: payments.description,
        })
        .from(payments)
        .where(eq(payments.enrollmentId, enrollment.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));

      // Progress counters describe tuition installments only. Both the
      // kit row and the initial down-payment row have their own concerns
      // and should not inflate "N of M paid" or "₹X paid so far". Rows
      // are identified by description.
      const tuitionPayments = enrollmentPayments.filter(
        (p) => p.description !== "Kit" && p.description !== "Initial Payment"
      );
      const kitPayment = enrollmentPayments.find(
        (p) => p.description === "Kit"
      );

      const paidCount = tuitionPayments.filter(
        (p) => p.paymentStatus === "paid"
      ).length;
      // Roll up: full amount for paid rows, partial chunks for in-progress
      // rows. amountPaid tracks each row's running total (0 when untouched,
      // == amount when fully paid).
      const totalPaid = tuitionPayments.reduce(
        (sum, p) =>
          sum +
          (p.paymentStatus === "paid" ? p.amount : (p.amountPaid ?? 0)),
        0
      );
      const nextUnpaid = tuitionPayments.find(
        (p) => p.paymentStatus === "unpaid"
      );
      const overduePayments = tuitionPayments.filter(
        (p) => p.paymentStatus === "overdue"
      );
      const oldestOverdue = overduePayments[0];

      // Joining date is locked once any tuition or kit row is paid or
      // overdue. Kit shares the lock because it anchors to joining day too
      // (changing joining day would otherwise rewrite the dueDate of an
      // already-collected kit fee).
      const isJoiningDateLocked =
        paidCount > 0 ||
        overduePayments.length > 0 ||
        (kitPayment !== undefined && kitPayment.paymentStatus !== "unpaid");

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
          admissionDate: enrollment.admissionDate.toISOString(),
          joiningDate: enrollment.joiningDate,
          isJoiningDateLocked,
          nextDueDate: nextUnpaid?.dueDate ?? null,
          hasOverdue: overduePayments.length > 0,
          oldestOverdueDate: oldestOverdue?.dueDate ?? null,
        },
        kit: kitPayment
          ? {
              amount: kitPayment.amount,
              amountPaid: kitPayment.amountPaid ?? 0,
              paymentStatus: kitPayment.paymentStatus,
              dueDate: kitPayment.dueDate,
            }
          : null,
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

        const lockedRow = existingRows.find(
          (row) =>
            row.paymentStatus === "paid" || row.paymentStatus === "overdue"
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
              row.description === "Kit"
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
