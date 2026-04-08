import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { protectedProcedure, router } from "../index";
import z from "zod";
import {
  STUDENT_SOURCES,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";

const LIMIT = 10;

export const studentsRouter = router({
  getAllStudents: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1),
      }),
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
      }),
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
      }),
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
    })
});
