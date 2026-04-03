import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  date,
  foreignKey,
  pgPolicy,
} from "drizzle-orm/pg-core";

import { enrollments } from "./enrollment";
import { paymentStatusEnum, paymentMethodEnum } from "./enums";
import { razorpayOrders } from "./razorpay-order";
import { students } from "./students";

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),

    studentId: integer("student_id").notNull(),
    enrollmentId: integer("enrollment_id").notNull(),
    razorpayOrderId: integer("razorpay_order_id"),

    amount: integer("amount").notNull(),
    description: varchar("description", { length: 255 }),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),

    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status")
      .default("unpaid")
      .notNull(),

    emiNumber: integer("emi_number"),

    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "payments_student_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [enrollments.id],
      name: "payments_enrollment_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.razorpayOrderId],
      foreignColumns: [razorpayOrders.id],
      name: "payments_razorpay_order_id_fk",
    }).onDelete("set null"),
    pgPolicy("payments_select_policy", {
      for: "select",
      to: "student",
      using: sql`student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())`,
    }),
    pgPolicy("payments_select_policy_admin", {
      for: "select",
      to: "admin",
      using: sql`true`,
    }),
    pgPolicy("payments_insert_policy", {
      for: "insert",
      to: "admin",
      withCheck: sql`true`,
    }),
    pgPolicy("payments_update_policy", {
      for: "update",
      to: "admin",
      using: sql`true`,
    }),
    pgPolicy("payments_delete_policy", {
      for: "delete",
      to: "admin",
      using: sql`true`,
    }),
  ]
).enableRLS();
