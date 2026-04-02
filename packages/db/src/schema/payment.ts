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

import { students } from "./student";
import { enrollments } from "./enrollment";
import { paymentStatusEnum, paymentMethodEnum } from "./enums";
import { razorpayOrders } from "./razorpay-order";

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
      .default("pending")
      .notNull(),

    emiNumber: integer("emi_number"),

    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "payments_student_id_fk",
    }),
    foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [enrollments.id],
      name: "payments_enrollment_id_fk",
    }),
    foreignKey({
      columns: [table.razorpayOrderId],
      foreignColumns: [razorpayOrders.id],
      name: "payments_razorpay_order_id_fk",
    }),
    pgPolicy("payments_insert_policy", {
      for: "insert",
      to: "public",
      withCheck: sql`true`,
    }),
    pgPolicy("payments_select_policy", {
      for: "select",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy("payments_update_policy", {
      for: "update",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy("payments_delete_policy", {
      for: "delete",
      to: "public",
      using: sql`true`,
    }),
  ]
).enableRLS();
