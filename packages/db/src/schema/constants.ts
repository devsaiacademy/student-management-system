export const PAYMENT_PLANS = ["single", "flexible"] as const;
export type PaymentPlan = (typeof PAYMENT_PLANS)[number];

export const STUDENT_STATUSES = ["active", "in_active", "discontinue"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_SOURCES = [
  "Banner",
  "Referral",
  "DM",
  "GAdds",
  "Walkin",
] as const;
export type StudentSource = (typeof STUDENT_SOURCES)[number];

export const PAYMENT_STATUSES = ["paid", "unpaid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "razorpay", "upi", "others"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// UI-only: methods an admin can pick when manually reconciling an offline
// payment. Excludes "razorpay" because the real Razorpay flow goes through the
// Pay button, not the Mark-Paid dialog.
export const MANUAL_PAYMENT_METHODS = ["upi", "cash", "others"] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export const STUDENT_PROGRESS_STATUSES = ["in_progress", "completed"] as const;
export type StudentProgressStatus = (typeof STUDENT_PROGRESS_STATUSES)[number];

// Form option constants — used as static dropdown sources and for server-side
// enum validation. Change these when the business adds courses, staff, etc.
export const COURSES = [
  "Robotics",
  "Programming",
  "AI / ML",
  "Web Development",
] as const;
export type Course = (typeof COURSES)[number];

export const DURATIONS = [
  "3 months",
  "6 months",
  "9 months",
  "12 months",
  "15 months",
  "18 months",
  "21 months",
  "24 months",
] as const;
export type Duration = (typeof DURATIONS)[number];

export const LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
] as const;
export type Level = (typeof LEVELS)[number];

export const ENROLLED_BY_NAMES = [
  "Sai",
  "Priya",
  "Mahi",
  "Mohan",
  "Dinesh",
] as const;
export type EnrolledByName = (typeof ENROLLED_BY_NAMES)[number];

export const EMI_MONTHS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type EmiMonthsOption = (typeof EMI_MONTHS_OPTIONS)[number];

export const STANDARDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Standard = (typeof STANDARDS)[number];

export const ENROLLED_MEDIUMS = ["Online", "Offline", "Hybrid"] as const;
export type EnrolledMedium = (typeof ENROLLED_MEDIUMS)[number];
