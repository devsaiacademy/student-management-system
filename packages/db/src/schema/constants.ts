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

// Form option constants — used as static dropdown sources and for server-side
// enum validation. Change these when the business adds courses, tutors, etc.
export const COURSES = [
  "Robotics",
  "Programming",
  "AI / ML",
  "Web Development",
] as const;
export type Course = (typeof COURSES)[number];

export const DURATIONS = ["3 months", "6 months", "12 months"] as const;
export type Duration = (typeof DURATIONS)[number];

export const LEVELS = ["Level 1", "Level 2", "Level 3"] as const;
export type Level = (typeof LEVELS)[number];

export const TUTOR_NAMES = [
  "Balaji",
  "Rahul",
  "Priya",
  "Arun",
] as const;
export type TutorName = (typeof TUTOR_NAMES)[number];

export const EMI_MONTHS_OPTIONS = [3, 6, 12] as const;
export type EmiMonthsOption = (typeof EMI_MONTHS_OPTIONS)[number];

export const ENROLLED_MEDIUMS = ["Online", "Offline", "Hybrid"] as const;
export type EnrolledMedium = (typeof ENROLLED_MEDIUMS)[number];
