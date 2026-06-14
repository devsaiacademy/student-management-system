import { db } from "@student-management-system/db";
import {
  REACHED_US_BY_OPTIONS,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";
import { courses } from "@student-management-system/db/schema/courses";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import z from "zod";

import {
  assertStudentAccess,
  protectedProcedure,
  router,
  staffProcedure,
  studentProcedure,
} from "../index";
import {
  buildTuitionAndKitRows,
  formatDateForPg,
} from "../lib/payment-schedule";
import { createStudentSchema } from "../schemas/student";

const LIMIT = 10;

export const studentsRouter = router({
  getAllStudents: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1),
      })
    )
    .query(async ({ input }) => {
      const { page } = input;

      const offset = (page - 1) * LIMIT;

      return db
        .select({
          id: students.id,
          name: students.name,
          rollNumber: students.rollNumber,
          email: students.email,
          studentStatus: students.studentStatus,
          reachedUsBy: students.reachedUsBy,
        })
        .from(students)
        .orderBy(desc(students.createdAt))
        .limit(LIMIT)
        .offset(offset);
    }),

  //used in  pagination component to get the total count and total pages
  getCount: protectedProcedure.query(async () => {
    const result = await db.select({ value: count() }).from(students);

    const totalCount = result[0]?.value ?? 0;

    return {
      totalCount,
      totalPages: Math.ceil(totalCount / LIMIT),
    };
  }),

  // filter students with status, no pagination
  filterStudentsWithStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(STUDENT_STATUSES).nullable(),
      })
    )
    .query(async ({ input }) => {
      const { status } = input;

      const query = db.select().from(students);

      const result =
        status === null
          ? await query
          : await query.where(eq(students.studentStatus, status));
      return result;
    }),

  // filter students with source, no pagination
  filterStudentsWithSource: protectedProcedure
    .input(
      z.object({
        source: z.enum(REACHED_US_BY_OPTIONS).nullable(),
      })
    )
    .query(async ({ input }) => {
      const { source } = input;

      const query = db.select().from(students);

      const result =
        source === null
          ? await query
          : await query.where(eq(students.reachedUsBy, source));
      return result;
    }),

  // search with no pagination

  searchStudents: protectedProcedure
    .input(
      z.object({
        search: z.string().nullable(),
        status: z.enum(STUDENT_STATUSES).nullable(),
        source: z.enum(REACHED_US_BY_OPTIONS).nullable(),
      })
    )
    .query(async ({ input }) => {
      const { search, status, source } = input;

      return db
        .select()
        .from(students)
        .where(
          and(
            search
              ? or(
                  ilike(students.name, `%${search}%`),
                  ilike(students.email, `%${search}%`),
                  ilike(students.rollNumber, `%${search}%`)
                )
              : undefined,

            // filter by status
            status ? eq(students.studentStatus, status) : undefined,

            //  filter by source
            source ? eq(students.reachedUsBy, source) : undefined
          )
        );
    }),

  // Student header card — avatar + name + contact + badges
  getStudentInfo: studentProcedure
    .input(z.object({ studentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { studentId } = input;
      assertStudentAccess(ctx, studentId);
      const [student] = await db
        .select({
          id: students.id,
          name: students.name,
          email: students.email,
          phoneNumber: students.phoneNumber,
          rollNumber: students.rollNumber,
          studentStatus: students.studentStatus,
          reachedUsBy: students.reachedUsBy,
          schoolName: students.schoolName,
          standard: students.standard,
          academicYear: students.academicYear,
        })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      const [latestEnrollment] = await db
        .select({
          kitProvided: enrollments.kitProvided,
          kitCost: enrollments.kitCost,
        })
        .from(enrollments)
        .where(eq(enrollments.studentId, input.studentId))
        .orderBy(desc(enrollments.createdAt))
        .limit(1);

      return {
        ...student,
        kitProvided: latestEnrollment?.kitProvided ?? false,
        kitCost: latestEnrollment?.kitCost ?? null,
      };
    }),

  // get student detail by id.
  getStudentDetailById: studentProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      assertStudentAccess(ctx, id);

      const student = await db
        .select()
        .from(students)
        .where(eq(students.id, id));

      return student;
    }),

  changeStudentStatus: studentProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        changeStatusTo: z.enum(STUDENT_STATUSES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { studentId, changeStatusTo } = input;
      assertStudentAccess(ctx, studentId);

      const [updatedStudent] = await db
        .update(students)
        .set({ studentStatus: changeStatusTo })
        .where(eq(students.id, studentId))
        .returning({ id: students.id, studentStatus: students.studentStatus });

      if (!updatedStudent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      return updatedStudent;
    }),

  // Creates a student and their first enrollment atomically. The tuition
  // payment schedule and the kit row anchor to `joiningDate`, which may not
  // be known yet:
  //   - If `joiningDate` is provided, payment rows are inserted in the same
  //     transaction and the student is `active`.
  //   - If `joiningDate` is omitted, only the optional Initial Payment row
  //     (anchored to `admissionDate`) is inserted; the student is `pending`
  //     until `enrollment.setJoiningDate` is called.
  createStudent: staffProcedure
    .input(createStudentSchema)
    .mutation(async ({ input }) => {
      try {
        // Course names come from a dynamic dropdown; reject stale clients
        // referencing a course that has since been deleted/renamed.
        const courseRow = await db.query.courses.findFirst({
          where: eq(courses.name, input.course),
          columns: { id: true },
        });
        if (!courseRow) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Course "${input.course}" no longer exists. Refresh the page and pick a current course.`,
          });
        }

        return await db.transaction(async (tx) => {
          // Status is derived from joiningDate: a student without a known
          // joining date is `pending` regardless of what the form sent. The
          // form's `studentStatus` is otherwise honored.
          const effectiveStatus = input.joiningDate
            ? input.studentStatus
            : ("pending" as const);

          // Parent auth.users is created lazily by the handle_new_user
          // trigger when the parent first signs in via magic link from
          // /login (matching by email). No admin-API call here.
          const [created] = await tx
            .insert(students)
            .values({
              name: input.name,
              rollNumber: input.rollNumber,
              age: input.age,
              dob: input.dob ? formatDateForPg(input.dob) : null,
              phoneNumber: input.phoneNumber,
              phoneNumber2: input.phoneNumber2 || null,
              email: input.email,
              address: input.address,
              schoolName: input.schoolName,
              standard: input.standard,
              academicYear: input.academicYear,
              motherName: input.motherName || null,
              motherOccupation: input.motherOccupation || null,
              fatherName: input.fatherName || null,
              fatherOccupation: input.fatherOccupation || null,
              studentStatus: effectiveStatus,
              reachedUsBy: input.reachedUsBy,
            })
            .returning({ id: students.id });

          if (!created) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create student",
            });
          }

          const [enrollment] = await tx
            .insert(enrollments)
            .values({
              studentId: created.id,
              course: input.course,
              level: input.level,
              duration: input.duration,
              closedBy: input.closedBy,
              totalFees: input.totalFees,
              initialPayment: input.initialPayment,
              paymentPlan: input.paymentPlan,
              emiMonths:
                input.paymentPlan === "installment" ? input.emiMonths : null,
              admissionDate: input.admissionDate,
              joiningDate: input.joiningDate
                ? formatDateForPg(input.joiningDate)
                : null,
              kitProvided: input.kitProvided,
              kitCost: input.kitProvided ? (input.kitCost ?? 0) : null,
            })
            .returning({ id: enrollments.id });

          if (!enrollment) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enrollment",
            });
          }

          const paymentRows: (typeof payments.$inferInsert)[] = [];

          // Initial down-payment row: inserted as already-paid on the
          // admission date. Always anchored to admission (a deposit is paid
          // at signup, not at joining). paymentMethod stays null because the
          // channel wasn't recorded at enrollment time. Skipped entirely
          // when initialPayment is 0 to keep the ledger identical to the
          // pre-feature behavior.
          if (input.initialPayment > 0) {
            const admissionDateString = formatDateForPg(input.admissionDate);
            paymentRows.push({
              studentId: created.id,
              enrollmentId: enrollment.id,
              amount: input.initialPayment,
              description: "Initial Payment",
              emiNumber: null,
              paymentStatus: "paid" as const,
              dueDate: admissionDateString,
              paidDate: admissionDateString,
            });
          }

          // Tuition + kit rows only when the joining date is known. Otherwise
          // the schedule is generated later by `enrollment.setJoiningDate`.
          if (input.joiningDate) {
            paymentRows.push(
              ...buildTuitionAndKitRows(
                {
                  studentId: created.id,
                  enrollmentId: enrollment.id,
                  totalFees: input.totalFees,
                  initialPayment: input.initialPayment,
                  paymentPlan: input.paymentPlan,
                  emiMonths: input.emiMonths,
                  kitProvided: input.kitProvided,
                  kitCost: input.kitProvided ? (input.kitCost ?? 0) : null,
                },
                input.joiningDate
              )
            );
          }

          if (paymentRows.length > 0) {
            await tx.insert(payments).values(paymentRows);
          }

          return { id: created.id };
        });
      } catch (error) {
        // Translate common unique-constraint violations into a friendly
        // field-level error so the form can highlight the right input.
        const message = error instanceof Error ? error.message : "";

        if (message.includes("students_roll_number_unique")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A student with this roll number already exists",
          });
        }
        if (message.includes("students_email_unique")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A student with this email already exists",
          });
        }
        if (error instanceof TRPCError) {
          throw error;
        }
        // Surface the underlying DB error so the client toast shows something
        // actionable (e.g. "null value in column \"payment_method\" violates
        // not-null constraint") instead of a generic "failed to create" that
        // hides the real cause during development.
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to add student, A student with this email or roll number already exists",
          cause: error,
        });
      }
    }),
});
