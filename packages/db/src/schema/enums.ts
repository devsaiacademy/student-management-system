import { pgEnum } from "drizzle-orm/pg-core";

import {
  PAYMENT_METHODS,
  PAYMENT_PLANS,
  PAYMENT_STATUSES,
  STUDENT_PROGRESS_STATUSES,
  STUDENT_SOURCES,
  STUDENT_STATUSES,
} from "./constants";

export const paymentPlanEnum = pgEnum("payment_plan", PAYMENT_PLANS);

export const studentStatusEnum = pgEnum("student_status", STUDENT_STATUSES);

export const studentSourceEnum = pgEnum("student_source", STUDENT_SOURCES);

export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);

export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);

export const studentProgressStatusEnum = pgEnum(
  "student_progress_status",
  STUDENT_PROGRESS_STATUSES
);
