import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  date,
  boolean,
  foreignKey,
  pgPolicy,
  check,
} from "drizzle-orm/pg-core";

import { levelEnum, paymentPlanEnum } from "./enums";
import { students } from "./students";

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),

    studentId: integer("student_id").notNull(),

    course: varchar("course", { length: 100 }).notNull(),
    level: levelEnum("level").notNull(),
    duration: varchar("duration", { length: 50 }).notNull(),
    closedBy: varchar("closed_by", { length: 100 }).notNull(),

    totalFees: integer("total_fees").notNull(),
    initialPayment: integer("initial_payment").default(0).notNull(),
    paymentPlan: paymentPlanEnum("payment_plan").notNull(),
    emiMonths: integer("emi_months"),

    admissionDate: timestamp("admission_date").notNull(),
    // Day the student actually begins attending classes. Unknown at admission;
    // set later through `enrollments.setJoiningDate`. Tuition + kit payment
    // rows are generated and re-anchored from this date.
    joiningDate: date("joining_date"),
    kitProvided: boolean("kit_provided").default(false).notNull(),
    kitCost: integer("kit_cost"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "enrollments_student_id_fk",
    }).onDelete("cascade"),
    check(
      "joining_date_after_admission",
      sql`joining_date IS NULL OR joining_date >= admission_date::date`
    ),
    pgPolicy("enrollments_select_policy_student", {
      for: "select",
      to: "authenticated",
      using: sql`student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'parent'`,
    }),
    pgPolicy("enrollments_select_policy_admin", {
      for: "select",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin', 'staff')`,
    }),
    pgPolicy("enrollments_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() IN ('admin', 'super_admin', 'staff')`,
    }),
    pgPolicy("enrollments_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin', 'staff')`,
    }),
    pgPolicy("enrollments_delete_policy", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin', 'staff')`,
    }),
  ]
).enableRLS();
