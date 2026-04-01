import { pgEnum } from "drizzle-orm/pg-core";

export const paymentTypeEnum = pgEnum("payment_type", ["single", "flexible"]);

export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "in_active",
  "discontinue",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "razorpay",
  "cash",
  "bank_transfer",
]);
