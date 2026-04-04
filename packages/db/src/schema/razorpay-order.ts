import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  json,
  foreignKey,
  pgPolicy,
} from "drizzle-orm/pg-core";

import { students } from "./students";

export const razorpayOrders = pgTable(
  "razorpay_orders",
  {
    id: serial("id").primaryKey(),

    studentId: integer("student_id").notNull(),

    razorpayOrderId: varchar("razorpay_order_id", { length: 255 })
      .notNull()
      .unique(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),
    receipt: varchar("receipt", { length: 255 }),

    status: varchar("status", { length: 50 }).default("created").notNull(),

    razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
    razorpaySignature: varchar("razorpay_signature", { length: 255 }),

    notes: json("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "razorpay_orders_student_id_fk",
    }).onDelete("cascade"),
    pgPolicy("razorpay_orders_select_policy_student", {
      for: "select",
      to: "authenticated",
      using: sql`student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student'`,
    }),
    pgPolicy("razorpay_orders_select_policy_admin", {
      for: "select",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("razorpay_orders_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("razorpay_orders_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("razorpay_orders_delete_policy", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
  ]
).enableRLS();
