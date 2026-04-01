import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

import { paymentTypeEnum, studentStatusEnum } from "./enums";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),
  rollNumber: varchar("roll_number", { length: 50 }).notNull().unique(),

  age: integer("age").notNull(),

  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),

  schoolName: varchar("school_name", { length: 255 }).notNull(),
  standard: varchar("standard", { length: 20 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),

  motherOccupation: varchar("mother_occupation", { length: 100 }),
  fatherOccupation: varchar("father_occupation", { length: 100 }),

  totalFees: integer("total_fees").notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  emiMonths: integer("emi_months"),
  level: varchar("level", { length: 50 }),

  studentStatus: studentStatusEnum("student_status")
    .default("active")
    .notNull(),

  kitProvided: boolean("kit_provided").default(false),

  tutorName: varchar("tutor_name", { length: 100 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
