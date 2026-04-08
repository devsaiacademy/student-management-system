import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { count, desc } from "drizzle-orm";

import { protectedProcedure, router } from "../index";
import z from "zod";


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
  getCount: protectedProcedure
    .query(async () => {
      const result = await db.select({ value: count() }).from(students);

      const totalCount = result[0]?.value ?? 0;

      return {
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      };
    }),
});
