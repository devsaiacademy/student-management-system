import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  pgPolicy,
  uuid,
} from "drizzle-orm/pg-core";

import { studentStatusEnum } from "./enums";

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),

    authUserId: uuid("auth_user_id").unique(),

    name: varchar("name", { length: 100 }).notNull(),
    rollNumber: varchar("roll_number", { length: 50 }).notNull().unique(),

    age: integer("age").notNull(),

    phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
    email: varchar("email", { length: 100 }).notNull().unique(),

    schoolName: varchar("school_name", { length: 255 }).notNull(),
    standard: varchar("standard", { length: 20 }).notNull(),
    academicYear: varchar("academic_year", { length: 20 }).notNull(),

    enrolledMedium: varchar("enrolled_medium", { length: 50 }).notNull(),

    motherName: varchar("mother_name", { length: 100 }),
    motherOccupation: varchar("mother_occupation", { length: 100 }),
    fatherName: varchar("father_name", { length: 100 }),
    fatherOccupation: varchar("father_occupation", { length: 100 }),

    studentStatus: studentStatusEnum("student_status")
      .default("active")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  () => [
    pgPolicy("students_select_policy", {
      for: "select",
      to: "student",
      using: sql`auth.uid() = auth_user_id`,
    }),
    pgPolicy("students_select_policy_admin", {
      for: "select",
      to: "admin",
      using: sql`true`,
    }),
    pgPolicy("students_insert_policy", {
      for: "insert",
      to: "admin",
      withCheck: sql`true`,
    }),
    pgPolicy("students_update_policy", {
      for: "update",
      to: "admin",
      using: sql`true`,
    }),
    pgPolicy("students_delete_policy", {
      for: "delete",
      to: "admin",
      using: sql`true`,
    }),
  ]
).enableRLS();
