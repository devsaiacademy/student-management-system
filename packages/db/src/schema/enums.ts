import { pgEnum } from "drizzle-orm/pg-core";

export const paymentPlanEnum = pgEnum("payment_plan", ["single", "flexible"]);

export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "in_active",
  "discontinue",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["paid", "unpaid"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "razorpay",
  "others",
]);

export const studentProgressStatusEnum = pgEnum("student_progress_status", [
  "in_progress",
  "completed",
]);
