import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { desc } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const studentsRouter = router({
  list: protectedProcedure.query(async () => {
    return db
      .select({
        id: students.id,
        name: students.name,
        rollNumber: students.rollNumber,
        email: students.email,
        studentStatus: students.studentStatus,
      })
      .from(students)
      .orderBy(desc(students.createdAt));
  }),
});
