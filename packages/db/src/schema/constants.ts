export const PAYMENT_PLANS = ["single", "flexible"] as const;
export type PaymentPlan = (typeof PAYMENT_PLANS)[number];

export const STUDENT_STATUSES = [
  "active",
  "in_active",
  "discontinue",
] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_SOURCES = ["Banner", "Referral"] as const;
export type StudentSource = (typeof STUDENT_SOURCES)[number];

export const PAYMENT_STATUSES = ["paid", "unpaid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "razorpay", "others"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STUDENT_PROGRESS_STATUSES = ["in_progress", "completed"] as const;
export type StudentProgressStatus = (typeof STUDENT_PROGRESS_STATUSES)[number];
