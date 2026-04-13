import { db } from "@student-management-system/db";
import { PAYMENT_METHODS } from "@student-management-system/db/schema/constants";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const studentIdInput = z.object({ studentId: z.number().int().positive() });

export const paymentsRouter = router({
  // Installments table for the latest enrollment only
  getStudentPayments: protectedProcedure
    .input(studentIdInput)
    .query(async ({ input }) => {
      const { studentId } = input;
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
          emiNumber: payments.emiNumber,
          dueDate: payments.dueDate,
          paymentStatus: payments.paymentStatus,
        })
        .from(payments)
        .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
        .where(eq(payments.enrollmentId, latestEnrollment.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));
    }),

  markPaymentAsPaid: protectedProcedure
    .input(
      z.object({
        paymentId: z.number().int().positive(),
        paymentMethod: z.enum(PAYMENT_METHODS),
      })
    )
    .mutation(async ({ input }) => {
      const { paymentId, paymentMethod } = input;

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
});
