import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { count } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const reportsRouter = router({
  // Distinct enrollment levels with student counts for the LEVELS COUNT bar chart.
  // One enrollment per student in practice, so this effectively counts students per level.
  getLevelsCount: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        level: enrollments.level,
        count: count(enrollments.id),
      })
      .from(enrollments)
      .groupBy(enrollments.level);

    return rows.map((row) => ({
      level: row.level,
      count: Number(row.count),
    }));
  }),
});
