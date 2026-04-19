import { db } from "@student-management-system/db";
import {
  STUDENT_SOURCES,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";
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
  studentProcedure,
} from "../index";
import { createStudentSchema } from "../schemas/student";

const LIMIT = 10;

// Format a Date as "YYYY-MM-DD" — Drizzle `date` columns expect a string.
const formatDateForPg = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Add `months` to `base`, clamping the day to the last day of the target
// month so Jan 31 + 1 month → Feb 28/29 (instead of JS's native rollover
// to Mar 3). Matches `date-fns` addMonths semantics.
const addMonthsClamped = (base: Date, months: number): Date => {
  const result = new Date(base);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return result;
};

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
          studentSource: students.studentSource,
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
        source: z.enum(STUDENT_SOURCES).nullable(),
      })
    )
    .query(async ({ input }) => {
      const { source } = input;

      const query = db.select().from(students);

      const result =
        source === null
          ? await query
          : await query.where(eq(students.studentSource, source));
      return result;
    }),

  // search with no pagination

  searchStudents: protectedProcedure
    .input(
      z.object({
        search: z.string().nullable(),
        status: z.enum(STUDENT_STATUSES).nullable(),
        source: z.enum(STUDENT_SOURCES).nullable(),
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
            source ? eq(students.studentSource, source) : undefined
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
          studentSource: students.studentSource,
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

  // Creates a student and their first enrollment atomically. If the
  // enrollment insert fails, the student insert is rolled back so we
  // never end up with orphan students.
  createStudent: protectedProcedure
    .input(createStudentSchema)
    .mutation(async ({ input }) => {
      try {
        return await db.transaction(async (tx) => {
          const [created] = await tx
            .insert(students)
            .values({
              name: input.name,
              rollNumber: input.rollNumber,
              age: input.age,
              phoneNumber: input.phoneNumber,
              email: input.email,
              schoolName: input.schoolName,
              standard: input.standard,
              academicYear: input.academicYear,
              enrolledMedium: input.enrolledMedium,
              motherName: input.motherName || null,
              motherOccupation: input.motherOccupation || null,
              fatherName: input.fatherName || null,
              fatherOccupation: input.fatherOccupation || null,
              studentStatus: input.studentStatus,
              studentSource: input.studentSource,
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
              enrolledBy: input.enrolledBy,
              totalFees: input.totalFees,
              paymentPlan: input.paymentPlan,
              emiMonths:
                input.paymentPlan === "flexible" ? input.emiMonths : null,
              startDate: input.startDate,
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

          // Generate the payment schedule for this enrollment. For a
          // flexible plan we create one row per EMI month; for a single
          // plan we create one row covering the full fee. All rows start
          // as unpaid with a null paymentMethod — the method is only known
          // once the student actually pays.
          //
          // totalFees is stored in rupees (int). We floor-divide across
          // installments and dump the remainder on the last row so the
          // sum equals totalFees exactly.
          const installmentCount =
            input.paymentPlan === "flexible" && input.emiMonths
              ? input.emiMonths
              : 1;
          const baseInstallment = Math.floor(
            input.totalFees / installmentCount
          );
          const remainder =
            input.totalFees - baseInstallment * installmentCount;

          const paymentRows: (typeof payments.$inferInsert)[] = Array.from(
            { length: installmentCount },
            (_, index) => {
              const isLast = index === installmentCount - 1;
              return {
                studentId: created.id,
                enrollmentId: enrollment.id,
                amount: baseInstallment + (isLast ? remainder : 0),
                emiNumber: installmentCount === 1 ? null : index + 1,
                paymentStatus: "unpaid" as const,
                dueDate: formatDateForPg(
                  addMonthsClamped(input.startDate, index)
                ),
              };
            }
          );

          // A kit payment row is added whenever a kit is provided. For a
          // paid kit (kitCost > 0) the row is created unpaid; for a
          // complementary kit (kitCost === 0) it's inserted as already paid
          // on the enrollment start date so the ledger reflects it without
          // ever showing as dues.
          if (input.kitProvided && typeof input.kitCost === "number") {
            const startDateString = formatDateForPg(input.startDate);
            paymentRows.push({
              studentId: created.id,
              enrollmentId: enrollment.id,
              amount: input.kitCost,
              description: "Kit",
              emiNumber: null,
              paymentStatus:
                input.kitCost === 0 ? ("paid" as const) : ("unpaid" as const),
              dueDate: startDateString,
              paidDate: input.kitCost === 0 ? startDateString : null,
            });
          }

          await tx.insert(payments).values(paymentRows);

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
