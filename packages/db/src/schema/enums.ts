import { pgEnum } from "drizzle-orm/pg-core";

import {
  LEVELS,
  PAYMENT_METHODS,
  PAYMENT_PLANS,
  PAYMENT_STATUSES,
  REACHED_US_BY_OPTIONS,
  STUDENT_PROGRESS_STATUSES,
  STUDENT_STATUSES,
} from "./constants";

export const paymentPlanEnum = pgEnum("payment_plan", PAYMENT_PLANS);

export const studentStatusEnum = pgEnum("student_status", STUDENT_STATUSES);

export const reachedUsByEnum = pgEnum("reached_us_by", REACHED_US_BY_OPTIONS);

export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);

export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);

export const studentProgressStatusEnum = pgEnum(
  "student_progress_status",
  STUDENT_PROGRESS_STATUSES
);

export const levelEnum = pgEnum("level", LEVELS);