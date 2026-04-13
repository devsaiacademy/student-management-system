import {
  COURSES,
  DURATIONS,
  EMI_MONTHS_OPTIONS,
  ENROLLED_MEDIUMS,
  LEVELS,
  PAYMENT_PLANS,
  STUDENT_SOURCES,
  STUDENT_STATUSES,
  TUTOR_NAMES,
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

// Shared schema for the "Add Student" form. Used by both the client form
// (zodResolver) and the tRPC mutation, so validation and types stay in sync.
// Fees are stored and submitted as **paise** (1 rupee = 100 paise).
export const createStudentSchema = z
  .object({
    // --- Student (students table) ---
    name: z.string().trim().min(2).max(100),
    rollNumber: z.string().trim().min(1).max(50),
    age: z.preprocess(toNumberOrUndefined, z.number().int().min(3).max(100)),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone number must be 10 digits"),
    email: z.email().max(100),
    schoolName: z.string().trim().min(1).max(255),
    standard: z.string().trim().min(1).max(20),
    academicYear: z.string().trim().min(1).max(20),

    motherName: z.string().trim().max(100).optional(),
    motherOccupation: z.string().trim().max(100).optional(),
    fatherName: z.string().trim().max(100).optional(),
    fatherOccupation: z.string().trim().max(100).optional(),

    enrolledMedium: z.enum(ENROLLED_MEDIUMS),
    studentSource: z.enum(STUDENT_SOURCES),
    studentStatus: z.enum(STUDENT_STATUSES),

    // --- Enrollment (enrollments table) ---
    course: z.enum(COURSES),
    duration: z.enum(DURATIONS),
    level: z.enum(LEVELS),
    tutorName: z.enum(TUTOR_NAMES),

    totalFees: z.preprocess(toNumberOrUndefined, z.number().int().positive()), // stored in rupees
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

    startDate: z.coerce.date(),
    kitProvided: z.boolean(),
  })
  .refine(
    (data) =>
      data.paymentPlan === "flexible" ? data.emiMonths !== null : true,
    {
      message: "EMI duration is required for a flexible payment plan",
      path: ["emiMonths"],
    }
  );

// Form uses the permissive INPUT type (strings in numeric fields are OK).
// tRPC receives the parsed OUTPUT type where those fields are numbers.
export type CreateStudentInput = z.input<typeof createStudentSchema>;
export type CreateStudentOutput = z.output<typeof createStudentSchema>;
