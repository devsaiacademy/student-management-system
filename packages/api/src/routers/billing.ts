import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const studentIdInput = z.object({ studentId: z.number().int().positive() });

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

  // Student header card — avatar + name + email + phone
  getStudentInfo: protectedProcedure
    .input(studentIdInput)
    .query(async ({ input }) => {
      const [student] = await db
        .select({
          id: students.id,
          name: students.name,
          email: students.email,
          phoneNumber: students.phoneNumber,
          rollNumber: students.rollNumber,
        })
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      return student;
    }),

  // Enrollment details + derived payment progress for the two-card overview
  getStudentEnrollment: protectedProcedure
    .input(studentIdInput)
    .query(async ({ input }) => {
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, input.studentId))
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
      const lastPayment = enrollmentPayments.at(-1);

      return {
        enrollment: {
          id: enrollment.id,
          course: enrollment.course,
          level: enrollment.level,
          duration: enrollment.duration,
          totalFees: enrollment.totalFees,
          paymentPlan: enrollment.paymentPlan,
          emiMonths: enrollment.emiMonths,
        },
        progress: {
          paidCount,
          totalCount: enrollmentPayments.length,
          totalPaid,
          startDate: enrollment.createdAt.toISOString(),
          endDate: lastPayment?.dueDate ?? null,
          nextDueDate: nextUnpaid?.dueDate ?? null,
        },
      };
    }),

  // Installments table — payments joined with their enrollment's course name
  getStudentPayments: protectedProcedure
    .input(studentIdInput)
    .query(async ({ input }) => {
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
        .where(eq(payments.studentId, input.studentId))
        .orderBy(asc(payments.emiNumber), asc(payments.dueDate));
    }),
});
