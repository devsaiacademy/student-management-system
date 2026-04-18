import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { assertStudentAccess, router, studentProcedure } from "../index";

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
          dueDate: payments.dueDate,
          paymentStatus: payments.paymentStatus,
        })
        .from(payments)
        .where(eq(payments.enrollmentId, enrollment.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));

      const paidCount = enrollmentPayments.filter(
        (p) => p.paymentStatus === "paid"
      ).length;
      const totalPaid = enrollmentPayments
        .filter((p) => p.paymentStatus === "paid")
        .reduce((sum, p) => sum + p.amount, 0);
      const nextUnpaid = enrollmentPayments.find(
        (p) => p.paymentStatus === "unpaid"
      );
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
          tutorName: enrollment.tutorName,
        },
        progress: {
          paidCount,
          totalCount: enrollmentPayments.length,
          totalPaid,
          startDate: enrollment.createdAt.toISOString(),
          nextDueDate: nextUnpaid?.dueDate ?? null,
        },
      };
    }),
});
