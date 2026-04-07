import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { desc, } from "drizzle-orm";

import { protectedProcedure, router } from "../index";
import z from "zod";

export const studentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        offset: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { limit, offset } = input;

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
        .limit(limit)
        .offset(offset);
    }),
});
