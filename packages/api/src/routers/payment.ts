import { db } from "@student-management-system/db";
import { PAYMENT_METHODS } from "@student-management-system/db/schema/constants";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import {
  payments,
  type PaymentMetaData,
} from "@student-management-system/db/schema/payment";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import {
  adminProcedure,
  assertStudentAccess,
  protectedProcedure,
  router,
  staffProcedure,
  studentProcedure,
} from "../index";
import { sendOverdueEmail } from "../lib/overdue-payments";

const studentIdInput = z.object({ studentId: z.number().int().positive() });

export const paymentsRouter = router({
  getPaymentOverview: protectedProcedure.query(async () => {
    const studentStatusSubquery = db
      .select({
        studentId: payments.studentId,
        hasUnpaid:
          sql<boolean>`bool_or(${payments.paymentStatus} IN ('unpaid', 'overdue', 'partially_paid'))`.as(
            "has_unpaid"
          ),
      })
      .from(payments)
      .groupBy(payments.studentId)
      .as("student_status");

    const [revenueResult, studentCountResult] = await Promise.all([
      db
        .select({
          totalBv: sql<number>`coalesce(sum(${payments.amount}), 0)`.mapWith(
            Number
          ),
          // Collected = full amount for fully-paid rows + accumulated chunks
          // for partially-paid (or otherwise in-progress) rows. amount_paid
          // is 0 for untouched rows so this also covers plain unpaid rows.
          totalCr:
            sql<number>`coalesce(sum(case when ${payments.paymentStatus} = 'paid' then ${payments.amount} else ${payments.amountPaid} end), 0)`.mapWith(
              Number
            ),
          // Pending = remaining balance (amount - amount_paid) for non-paid
          // rows belonging to active students. Includes partially_paid rows
          // so a half-paid installment shows the half still due.
          totalPending:
            sql<number>`coalesce(sum(case when ${payments.paymentStatus} IN ('unpaid', 'overdue', 'partially_paid') and ${students.studentStatus} <> 'discontinue' then ${payments.amount} - ${payments.amountPaid} else 0 end), 0)`.mapWith(
              Number
            ),
          totalDiscontinued:
            sql<number>`coalesce(sum(case when ${payments.paymentStatus} IN ('unpaid', 'overdue', 'partially_paid') and ${students.studentStatus} = 'discontinue' then ${payments.amount} - ${payments.amountPaid} else 0 end), 0)`.mapWith(
              Number
            ),
        })
        .from(payments)
        .innerJoin(students, eq(payments.studentId, students.id)),
      db
        .select({
          paidStudents:
            sql<number>`coalesce(count(*) filter (where not ${studentStatusSubquery.hasUnpaid}), 0)`.mapWith(
              Number
            ),
          unpaidStudents:
            sql<number>`coalesce(count(*) filter (where ${studentStatusSubquery.hasUnpaid}), 0)`.mapWith(
              Number
            ),
        })
        .from(studentStatusSubquery),
    ]);

    return {
      revenue: {
        totalBv: revenueResult[0]?.totalBv ?? 0,
        totalCr: revenueResult[0]?.totalCr ?? 0,
        totalPending: revenueResult[0]?.totalPending ?? 0,
        totalDiscontinued: revenueResult[0]?.totalDiscontinued ?? 0,
      },
      studentCounts: {
        paid: studentCountResult[0]?.paidStudents ?? 0,
        unpaid: studentCountResult[0]?.unpaidStudents ?? 0,
      },
    };
  }),

  // Installments table for the latest enrollment only
  getStudentPayments: studentProcedure
    .input(studentIdInput)
    .query(async ({ ctx, input }) => {
      const { studentId } = input;
      assertStudentAccess(ctx, studentId);
      const [latestEnrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId))
        .orderBy(desc(enrollments.createdAt))
        .limit(1);

      if (!latestEnrollment) {
        return [];
      }

      return db
        .select({
          id: payments.id,
          enrollmentId: payments.enrollmentId,
          course: enrollments.course,
          amount: payments.amount,
          amountPaid: payments.amountPaid,
          partialPaymentEnabled: payments.partialPaymentEnabled,
          description: payments.description,
          emiNumber: payments.emiNumber,
          dueDate: payments.dueDate,
          paymentStatus: payments.paymentStatus,
          paymentMethod: payments.paymentMethod,
          metaData: payments.metaData,
        })
        .from(payments)
        .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
        .where(eq(payments.enrollmentId, latestEnrollment.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));
    }),

  markPaymentAsPaid: studentProcedure
    .input(
      z.object({
        paymentId: z.number().int().positive(),
        paymentMethod: z.enum(PAYMENT_METHODS),
        // Offline chunk amount the admin is recording. When this is less
        // than the remaining balance the row flips to partially_paid; when
        // equal it flips to paid.
        amount: z.number().int().positive(),
        reason: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentId, paymentMethod, amount, reason } = input;

      return db.transaction(async (tx) => {
        // FOR UPDATE serializes concurrent mark-paid clicks: two parallel
        // requests would otherwise both read the same amountPaid and the
        // second's `amount > remaining` check would pass against stale state.
        const [owner] = await tx
          .select({
            studentId: payments.studentId,
            amount: payments.amount,
            amountPaid: payments.amountPaid,
            paymentMethod: payments.paymentMethod,
            metaData: payments.metaData,
          })
          .from(payments)
          .where(eq(payments.id, paymentId))
          .for("update")
          .limit(1);

        if (!owner) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment not found",
          });
        }

        assertStudentAccess(ctx, owner.studentId);

        const penalty = owner.metaData?.penalty ?? 0;
        const totalDue = owner.amount + penalty;
        const remaining = Math.max(0, totalDue - owner.amountPaid);

        if (amount > remaining) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Amount exceeds remaining balance of ${remaining}`,
          });
        }

        const newAmountPaid = owner.amountPaid + amount;
        const isFullyPaid = newAmountPaid >= totalDue;

        const existingLog = owner.metaData?.partialPaymentLog ?? [];
        const nextLog = [
          ...existingLog,
          {
            at: new Date().toISOString(),
            amount,
          },
        ];

        // Preserve "razorpay" when any prior chunk landed via Razorpay —
        // otherwise an offline mark-paid of the remainder would overwrite
        // the method, and the markPaymentAsUnpaid guard (which blocks reverts
        // for razorpay rows) would mis-classify the row as offline.
        const hasRazorpayChunk =
          owner.paymentMethod === "razorpay" ||
          existingLog.some((entry) => entry.razorpayPaymentId);
        const finalMethod = hasRazorpayChunk ? "razorpay" : paymentMethod;

        const metaData: PaymentMetaData = {
          ...(owner.metaData ?? {}),
          markedPaidBy: ctx.user.email,
          markedPaidAt: new Date().toISOString(),
          ...(reason ? { markedPaidReason: reason } : {}),
          partialPaymentLog: nextLog,
        };

        const [updated] = await tx
          .update(payments)
          .set({
            paymentStatus: isFullyPaid ? "paid" : "partially_paid",
            paymentMethod: finalMethod,
            paidDate: isFullyPaid
              ? new Date().toISOString().split("T")[0]
              : null,
            amountPaid: newAmountPaid,
            metaData,
          })
          .where(
            and(
              eq(payments.id, paymentId),
              inArray(payments.paymentStatus, [
                "unpaid",
                "overdue",
                "partially_paid",
              ])
            )
          )
          .returning({ id: payments.id });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment not found or already paid",
          });
        }

        return { id: updated.id };
      });
    }),

  markPaymentAsUnpaid: adminProcedure
    .input(
      z.object({
        paymentId: z.number().int().positive(),
        reason: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentId, reason } = input;

      const [owner] = await db
        .select({
          paymentMethod: payments.paymentMethod,
          metaData: payments.metaData,
        })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!owner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (owner.paymentMethod === "razorpay") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Razorpay payments cannot be reverted from the app. Issue a refund instead.",
        });
      }

      const metaData: PaymentMetaData = {
        ...(owner.metaData ?? {}),
        markedUnpaidBy: ctx.user.email,
        markedUnpaidAt: new Date().toISOString(),
        ...(reason ? { markedUnpaidReason: reason } : {}),
      };

      const [updated] = await db
        .update(payments)
        .set({
          paymentStatus: "unpaid",
          paymentMethod: null,
          paidDate: null,
          metaData,
        })
        .where(
          and(eq(payments.id, paymentId), eq(payments.paymentStatus, "paid"))
        )
        .returning({ id: payments.id });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found or already unpaid",
        });
      }

      return { id: updated.id };
    }),

  createPayment: staffProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        amount: z.number().int().positive(),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
          message: "dueDate must be in YYYY-MM-DD format",
        }),
        description: z.string().trim().min(1).max(255),
      })
    )
    .mutation(async ({ input }) => {
      const { studentId, amount, dueDate, description } = input;

      const [latestEnrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId))
        .orderBy(desc(enrollments.createdAt))
        .limit(1);

      if (!latestEnrollment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Student has no enrollment to attach payment to",
        });
      }

      const [inserted] = await db
        .insert(payments)
        .values({
          studentId,
          enrollmentId: latestEnrollment.id,
          amount,
          dueDate,
          description,
          paymentStatus: "unpaid",
        })
        .returning({ id: payments.id });

      if (!inserted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment",
        });
      }

      return { id: inserted.id };
    }),

  sendPaymentReminder: staffProcedure
    .input(z.object({ paymentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .select({
          id: payments.id,
          paymentStatus: payments.paymentStatus,
        })
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (row.paymentStatus === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This payment has already been paid",
        });
      }

      try {
        await sendOverdueEmail(input.paymentId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to send reminder",
        });
      }

      return { notifiedAt: new Date().toISOString() };
    }),
});
