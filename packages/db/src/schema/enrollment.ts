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

import { paymentTypeEnum } from "./enums";
import { students } from "./student";

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
    paymentType: paymentTypeEnum("payment_type").notNull(),
    emiMonths: integer("emi_months"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "enrollments_student_id_fk",
    }),
    pgPolicy("enrollments_insert_policy", {
      for: "insert",
      to: "public",
      withCheck: sql`true`,
    }),
    pgPolicy("enrollments_select_policy", {
      for: "select",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy("enrollments_update_policy", {
      for: "update",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy("enrollments_delete_policy", {
      for: "delete",
      to: "public",
      using: sql`true`,
    }),
  ]
).enableRLS();
