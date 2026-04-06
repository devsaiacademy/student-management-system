import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const billingRouter = router({
  getStudentBilling: protectedProcedure
    .input(z.object({ studentId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const studentId = input?.studentId;

      let student;
      if (studentId) {
        [student] = await db
          .select()
          .from(students)
          .where(eq(students.id, studentId));
      } else {
        [student] = await db
          .select()
          .from(students)
          .where(eq(students.email, ctx.user.email));
      }

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      const studentEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, student.id));

      const studentPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.studentId, student.id))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));

      return {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          phoneNumber: student.phoneNumber,
          rollNumber: student.rollNumber,
        },
        enrollments: studentEnrollments.map((e) => ({
          id: e.id,
          course: e.course,
          level: e.level,
          duration: e.duration,
          totalFees: e.totalFees,
          paymentPlan: e.paymentPlan,
          emiMonths: e.emiMonths,
          createdAt: e.createdAt,
        })),
        payments: studentPayments.map((p) => ({
          id: p.id,
          enrollmentId: p.enrollmentId,
          amount: p.amount,
          emiNumber: p.emiNumber,
          dueDate: p.dueDate,
          paidDate: p.paidDate,
          paymentStatus: p.paymentStatus,
          paymentMethod: p.paymentMethod,
        })),
      };
    }),
});
