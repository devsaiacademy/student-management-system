import { db } from "@student-management-system/db";
import {
  STUDENT_SOURCES,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
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

  // get student detail by id.
  getStudentDetailById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { id } = input;

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

          await tx.insert(enrollments).values({
            studentId: created.id,
            course: input.course,
            level: input.level,
            duration: input.duration,
            tutorName: input.tutorName,
            totalFees: input.totalFees,
            paymentPlan: input.paymentPlan,
            emiMonths:
              input.paymentPlan === "flexible" ? input.emiMonths : null,
            startDate: input.startDate,
            kitProvided: input.kitProvided,
          });

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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create student",
        });
      }
    }),
});
