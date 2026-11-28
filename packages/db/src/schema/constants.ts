export const USER_ROLES = ["super_admin", "admin", "staff", "parent"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PAYMENT_PLANS = ["single", "installment"] as const;
export type PaymentPlan = (typeof PAYMENT_PLANS)[number];

export const STUDENT_STATUSES = [
  "pending",
  "active",
  "in_active",
  "discontinue",
] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const REACHED_US_BY_OPTIONS = [
  "Board / Walkin",
  "G Adds",
  "Meta Adds",
  "Referral",
  "Call",
  "DM",
  "Other Branches",
] as const;
export type ReachedUsBy = (typeof REACHED_US_BY_OPTIONS)[number];

export const PAYMENT_STATUSES = [
  "paid",
  "unpaid",
  "overdue",
  "partially_paid",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "razorpay", "upi", "others"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// UI-only: methods an admin can pick when manually reconciling an offline
// payment. Excludes "razorpay" because the real Razorpay flow goes through the
// Pay button, not the Mark-Paid dialog.
export const MANUAL_PAYMENT_METHODS = ["upi", "cash", "others"] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

// What a payment row is for. Replaces the old description-string sniffing
// ("Kit" vs everything else). Defaults to "tuition_fee"; the kit row is the
// only one tagged "kit_fee".
export const PAYMENT_TYPES = ["tuition_fee", "kit_fee"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const STUDENT_PROGRESS_STATUSES = ["in_progress", "completed"] as const;
export type StudentProgressStatus = (typeof STUDENT_PROGRESS_STATUSES)[number];

// Form option constants — used as static dropdown sources and for server-side
// enum validation. Change these when the business adds new options. Course
// names live in the `courses` table, fetched via `trpc.courses.list`.
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
  "Level 1 - 2",
  "Level 1 - 3",
  "Level 1 - 4",
  "Level 1 - 5",
  "Level 1 - 6",
  "Level 2",
  "Level 2 - 3",
  "Level 3",
  "Level 4",
  "Level 4 - 6",
  "Level 5",
  "Level 6",
] as const;
export type Level = (typeof LEVELS)[number];

export const CLOSED_BY_NAMES = [
  "Sai",
  "Priya",
  "Mahi",
  "Mohan",
  "Dinesh",
] as const;
export type ClosedByName = (typeof CLOSED_BY_NAMES)[number];

export const EMI_MONTHS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type EmiMonthsOption = (typeof EMI_MONTHS_OPTIONS)[number];

export const STANDARDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Standard = (typeof STANDARDS)[number];
