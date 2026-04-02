import { pgEnum } from "drizzle-orm/pg-core";

export const paymentTypeEnum = pgEnum("payment_type", ["single", "flexible"]);

export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "in_active",
  "discontinue",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "razorpay",
  "cash",
  "bank_transfer",
]);

export const studentProgressStatusEnum = pgEnum("student_progress_status", [
  "in_progress",
  "completed",
  "dropped",
  "paused",
]);
