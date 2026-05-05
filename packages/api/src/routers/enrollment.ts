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
          description: payments.description,
        })
        .from(payments)
        .where(eq(payments.enrollmentId, enrollment.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));

      // Progress counters describe tuition only — the kit payment row has
      // its own card and should not inflate "N of M paid" or "₹X paid so
      // far". Kit rows are identified by description === "Kit".
      const tuitionPayments = enrollmentPayments.filter(
        (p) => p.description !== "Kit"
      );
      const kitPayment = enrollmentPayments.find(
        (p) => p.description === "Kit"
      );

      const paidCount = tuitionPayments.filter(
        (p) => p.paymentStatus === "paid"
      ).length;
      const totalPaid = tuitionPayments
        .filter((p) => p.paymentStatus === "paid")
        .reduce((sum, p) => sum + p.amount, 0);
      const nextUnpaid = tuitionPayments.find(
        (p) => p.paymentStatus === "unpaid"
      );
      const overduePayments = tuitionPayments.filter(
        (p) => p.paymentStatus === "overdue"
      );
      const oldestOverdue = overduePayments[0];

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
        },
        progress: {
          paidCount,
          totalCount: tuitionPayments.length,
          totalPaid,
          admissionDate: enrollment.createdAt.toISOString(),
          nextDueDate: nextUnpaid?.dueDate ?? null,
          hasOverdue: overduePayments.length > 0,
          oldestOverdueDate: oldestOverdue?.dueDate ?? null,
        },
        kit: kitPayment
          ? {
              amount: kitPayment.amount,
              paymentStatus: kitPayment.paymentStatus,
              dueDate: kitPayment.dueDate,
            }
          : null,
      };
    }),
});
