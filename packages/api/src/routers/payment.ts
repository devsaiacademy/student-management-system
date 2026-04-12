import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { asc, desc, eq } from "drizzle-orm";
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
});
