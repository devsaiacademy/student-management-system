import { db } from "@student-management-system/db";
import {
  LEVELS,
  REACHED_US_BY_OPTIONS,
} from "@student-management-system/db/schema/constants";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { students } from "@student-management-system/db/schema/students";
import { count } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const reportsRouter = router({
  // Student counts per enrollment level. Includes all LEVELS values, with
  // zero-count entries for levels with no enrollments so the chart axis stays
  // stable and the pie view can compute a complete breakdown.
  getLevelsCount: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        level: enrollments.level,
        count: count(enrollments.id),
      })
      .from(enrollments)
      .groupBy(enrollments.level);

    const countsByLevel = new Map(
      rows.map((row) => [row.level, Number(row.count)])
    );

    return LEVELS.map((level) => ({
      level,
      count: countsByLevel.get(level) ?? 0,
    }));
  }),

  // Student counts per source. Includes all REACHED_US_BY_OPTIONS values, with zero-count
  // entries for sources with no students so the X-axis stays stable.
  getSourcesCount: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        source: students.reachedUsBy,
        count: count(students.id),
      })
      .from(students)
      .groupBy(students.reachedUsBy);

    const countsBySource = new Map(
      rows.map((row) => [row.source, Number(row.count)])
    );

    return REACHED_US_BY_OPTIONS.map((source) => ({
      source,
      count: countsBySource.get(source) ?? 0,
    }));
  }),
});
