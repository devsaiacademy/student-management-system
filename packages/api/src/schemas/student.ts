import {
  DURATIONS,
  EMI_MONTHS_OPTIONS,
  LEVELS,
  PAYMENT_PLANS,
  REACHED_US_BY_OPTIONS,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";
import z from "zod";

// Accepts an empty string / undefined from form state and forwards it as
// `undefined` so downstream `z.number()` reports "Required" instead of a
// confusing NaN or coercion error. `null` is preserved as-is so nullable
// number fields (e.g. `emiMonths` when paymentPlan is "single") pass through
// without being turned into `undefined` — which `.nullable()` rejects.
const toNumberOrUndefined = (value: unknown) => {
  if (value === "" || value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return value;
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value == null ? undefined : value;

// Shared field definitions for the Add/Edit Student forms. Both the create
// and update schemas spread this object so validation and types stay in sync.
// Fees and kit cost are stored and submitted as **rupees** (integer).
const studentFields = {
  // --- Student (students table) ---
  name: z.string().trim().min(2).max(100),
  rollNumber: z.string().trim().min(1).max(50),
  age: z.preprocess(toNumberOrUndefined, z.number().int().min(3).max(100)),
  // Optional. Empty string from the form is normalised to `undefined`.
  dob: z.preprocess(emptyToUndefined, z.coerce.date()).optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be 10 digits"),
  // Optional secondary contact. Validated as 10 digits only when provided;
  // an empty value is normalised to `undefined`.
  phoneNumber2: z
    .preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .regex(/^\d{10}$/, "Phone number must be 10 digits")
    )
    .optional(),
  email: z.email().max(100),
  // Mandatory in the form even though the DB column is nullable.
  address: z.string().trim().min(5).max(500),
  schoolName: z.string().trim().min(1).max(255),
  standard: z.string().trim().min(1).max(20),
  academicYear: z.string().trim().min(1).max(20),

  motherName: z.string().trim().max(100).optional(),
  motherOccupation: z.string().trim().max(100).optional(),
  fatherName: z.string().trim().max(100).optional(),
  fatherOccupation: z.string().trim().max(100).optional(),

  reachedUsBy: z.enum(REACHED_US_BY_OPTIONS),
  studentStatus: z.enum(STUDENT_STATUSES),

  // --- Enrollment (enrollments table) ---
  // Course is a free-form name validated against the `courses` table at
  // mutation time — the dropdown options are sourced dynamically via
  // `trpc.courses.list`.
  course: z.string().trim().min(1).max(100),
  duration: z.enum(DURATIONS),
  level: z.enum(LEVELS),
  // The dropdown is populated dynamically from user_profiles (workers).
  // Validated only as a non-empty string; the DB column is varchar(100).
  closedBy: z.string().trim().min(1).max(100),

  totalFees: z.preprocess(toNumberOrUndefined, z.number().int().positive()), // stored in rupees
  initialPayment: z.preprocess(
    toNumberOrUndefined,
    z.number().int().min(0).default(0)
  ), // rupees paid upfront at enrollment; 0 means no down payment
  paymentPlan: z.enum(PAYMENT_PLANS),
  emiMonths: z.preprocess(
    toNumberOrUndefined,
    z
      .number()
      .int()
      .refine(
        (value) => (EMI_MONTHS_OPTIONS as readonly number[]).includes(value),
        { message: "Invalid EMI duration" }
      )
      .nullable()
  ),

  admissionDate: z.coerce.date(),
  // Optional at student creation. When provided, payment generation runs
  // inline as part of `createStudent`. When omitted, the student is created
  // in `pending` status and tuition+kit rows are inserted later via
  // `enrollment.setJoiningDate`.
  joiningDate: z.preprocess(emptyToUndefined, z.coerce.date()).optional(),
  kitProvided: z.boolean(),
  kitCost: z.number().int().min(0).optional(),
};

// Cross-field validation shared by the create and update schemas. Typed
// against the subset of fields it inspects so the same callback is assignable
// to both schemas' `superRefine` (the update output is a superset with `id`).
type StudentRefineData = {
  dob?: Date;
  paymentPlan: "single" | "installment";
  emiMonths: number | null;
  initialPayment: number;
  totalFees: number;
  kitProvided: boolean;
  kitCost?: number;
  admissionDate: Date;
  joiningDate?: Date;
};

const refineStudent = (data: StudentRefineData, ctx: z.RefinementCtx) => {
  if (data.dob && data.dob > new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date of birth cannot be in the future",
      path: ["dob"],
    });
  }
  if (data.paymentPlan === "installment" && data.emiMonths === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "EMI duration is required for an installment payment plan",
      path: ["emiMonths"],
    });
  }
  if (data.initialPayment >= data.totalFees) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Initial Payment must be less than the total fees",
      path: ["initialPayment"],
    });
  }
  if (data.kitProvided && typeof data.kitCost !== "number") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Kit cost is required when a kit is provided (enter 0 if complementary)",
      path: ["kitCost"],
    });
  }
  if (data.joiningDate && data.joiningDate < data.admissionDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Joining date cannot be before admission date",
      path: ["joiningDate"],
    });
  }
};

// Shared schema for the "Add Student" form. Used by both the client form
// (zodResolver) and the tRPC mutation, so validation and types stay in sync.
export const createStudentSchema = z
  .object(studentFields)
  .superRefine(refineStudent);

// Address is mandatory when ADDING a student, but pre-migration students may
// have a null/empty address. On EDIT we drop the min-length requirement so an
// admin isn't blocked from saving an unrelated change (e.g. a phone number)
// just because the legacy record has no address. The INPUT type is still
// `address: string`, so the form's CreateStudentInput stays compatible.
const editStudentFields = {
  ...studentFields,
  address: z.string().trim().max(500),
};

// Client-side resolver for the edit form (no `id`; relaxed address).
export const editStudentFormSchema = z
  .object(editStudentFields)
  .superRefine(refineStudent);

// "Edit Student" server schema: the edit fields plus the target student id.
// The server ignores the read-only fields (rollNumber, initialPayment,
// joiningDate) when applying the update.
export const updateStudentSchema = z
  .object({ ...editStudentFields, id: z.number().int().positive() })
  .superRefine(refineStudent);

// Form uses the permissive INPUT type (strings in numeric fields are OK).
// tRPC receives the parsed OUTPUT type where those fields are numbers.
export type CreateStudentInput = z.input<typeof createStudentSchema>;
export type CreateStudentOutput = z.output<typeof createStudentSchema>;

export type UpdateStudentInput = z.input<typeof updateStudentSchema>;
export type UpdateStudentOutput = z.output<typeof updateStudentSchema>;
