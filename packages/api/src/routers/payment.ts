import { db } from "@student-management-system/db";
import { PAYMENT_METHODS } from "@student-management-system/db/schema/constants";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  assertStudentAccess,
  protectedProcedure,
  router,
  studentProcedure,
} from "../index";

const studentIdInput = z.object({ studentId: z.number().int().positive() });

export const paymentsRouter = router({
  getPaymentOverview: protectedProcedure.query(async () => {
    // Run all three aggregate queries in parallel
    const studentStatusSubquery = db
      .select({
        studentId: payments.studentId,
        hasUnpaid:
          sql<boolean>`bool_or(${payments.paymentStatus} = 'unpaid')`.as(
            "has_unpaid"
          ),
      })
      .from(payments)
      .groupBy(payments.studentId)
      .as("student_status");

    const [bvResult, revenueResult, studentCountResult] = await Promise.all([
      db
        .select({
          totalBv:
            sql<number>`coalesce(sum(${enrollments.totalFees}), 0)`.mapWith(
              Number
            ),
        })
        .from(enrollments),
      db
        .select({
          totalCr:
            sql<number>`coalesce(sum(case when ${payments.paymentStatus} = 'paid' then ${payments.amount} else 0 end), 0)`.mapWith(
              Number
            ),
          totalPending:
            sql<number>`coalesce(sum(case when ${payments.paymentStatus} = 'unpaid' then ${payments.amount} else 0 end), 0)`.mapWith(
              Number
            ),
        })
        .from(payments),
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
        totalBv: bvResult[0]?.totalBv ?? 0,
        totalCr: revenueResult[0]?.totalCr ?? 0,
        totalPending: revenueResult[0]?.totalPending ?? 0,
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
          description: payments.description,
          emiNumber: payments.emiNumber,
          dueDate: payments.dueDate,
          paymentStatus: payments.paymentStatus,
          paymentMethod: payments.paymentMethod,
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentId, paymentMethod } = input;

      const [owner] = await db
        .select({ studentId: payments.studentId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!owner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      assertStudentAccess(ctx, owner.studentId);

      const [updated] = await db
        .update(payments)
        .set({
          paymentStatus: "paid",
          paymentMethod,
          paidDate: new Date().toISOString().split("T")[0],
        })
        .where(
          and(eq(payments.id, paymentId), eq(payments.paymentStatus, "unpaid"))
        )
        .returning({ id: payments.id });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found or already paid",
        });
      }

      return { id: updated.id };
    }),

  markPaymentAsUnpaid: studentProcedure
    .input(z.object({ paymentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { paymentId } = input;

      const [owner] = await db
        .select({
          studentId: payments.studentId,
          paymentMethod: payments.paymentMethod,
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

      assertStudentAccess(ctx, owner.studentId);

      if (owner.paymentMethod === "razorpay") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Razorpay payments cannot be reverted from the app. Issue a refund instead.",
        });
      }

      const [updated] = await db
        .update(payments)
        .set({
          paymentStatus: "unpaid",
          paymentMethod: null,
          paidDate: null,
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
});
