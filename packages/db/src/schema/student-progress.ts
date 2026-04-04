import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  foreignKey,
  pgPolicy,
} from "drizzle-orm/pg-core";

import { enrollments } from "./enrollment";
import { studentProgressStatusEnum } from "./enums";
import { students } from "./students";

export const studentProgress = pgTable(
  "student_progress",
  {
    id: serial("id").primaryKey(),

    studentId: integer("student_id").notNull(),
    enrollmentId: integer("enrollment_id").notNull(),

    course: varchar("course", { length: 100 }).notNull(),
    level: varchar("level", { length: 50 }).notNull(),
    duration: varchar("duration", { length: 50 }).notNull(),

    kitProvided: boolean("kit_provided").default(false).notNull(),

    tutorName: varchar("tutor_name", { length: 100 }).notNull(),

    status: studentProgressStatusEnum("status")
      .default("in_progress")
      .notNull(),

    startDate: date("start_date").notNull(),
    endDate: date("end_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "student_progress_student_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [enrollments.id],
      name: "student_progress_enrollment_id_fk",
    }).onDelete("cascade"),
    pgPolicy("student_progress_select_policy_student", {
      for: "select",
      to: "authenticated",
      using: sql`student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student'`,
    }),
    pgPolicy("student_progress_select_policy_admin", {
      for: "select",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("student_progress_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("student_progress_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("student_progress_delete_policy", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
  ]
).enableRLS();
