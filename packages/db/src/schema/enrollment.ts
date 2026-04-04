import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  foreignKey,
  pgPolicy,
} from "drizzle-orm/pg-core";

import { paymentPlanEnum } from "./enums";
import { students } from "./students";

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),

    studentId: integer("student_id").notNull(),

    course: varchar("course", { length: 100 }).notNull(),
    level: varchar("level", { length: 50 }).notNull(),
    duration: varchar("duration", { length: 50 }).notNull(),
    tutorName: varchar("tutor_name", { length: 100 }).notNull(),

    totalFees: integer("total_fees").notNull(),
    paymentPlan: paymentPlanEnum("payment_plan").notNull(),
    emiMonths: integer("emi_months"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "enrollments_student_id_fk",
    }).onDelete("cascade"),
    pgPolicy("enrollments_select_policy_student", {
      for: "select",
      to: "authenticated",
      using: sql`student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student'`,
    }),
    pgPolicy("enrollments_select_policy_admin", {
      for: "select",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("enrollments_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("enrollments_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("enrollments_delete_policy", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
  ]
).enableRLS();
