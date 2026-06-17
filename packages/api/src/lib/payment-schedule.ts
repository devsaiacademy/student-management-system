import type { payments } from "@student-management-system/db/schema/payment";

// A schedule row "locks" fee edits when real money is recorded against it, or
// it is overdue (rebuilding would silently discard a past-due obligation).
// A 0-amount row auto-marked "paid" — a complimentary kit — represents NO
// money collected, so it must NOT lock: otherwise every free-kit student's
// fees would be permanently uneditable. Callers exclude the "Initial Payment"
// deposit row separately before applying this predicate.
export const isLockingPaymentRow = (row: {
  paymentStatus: "paid" | "unpaid" | "overdue" | "partially_paid";
  amount: number;
}): boolean =>
  row.paymentStatus === "overdue" ||
  row.paymentStatus === "partially_paid" ||
  (row.paymentStatus === "paid" && row.amount > 0);

// Format a Date as "YYYY-MM-DD" — Drizzle `date` columns expect a string.
export const formatDateForPg = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Add `months` to `base`, clamping the day to the last day of the target
// month so Jan 31 + 1 month → Feb 28/29 (instead of JS's native rollover
// to Mar 3). Matches `date-fns` addMonths semantics.
export const addMonthsClamped = (base: Date, months: number): Date => {
  const result = new Date(base);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return result;
};

type EnrollmentSnapshot = {
  studentId: number;
  enrollmentId: number;
  totalFees: number;
  initialPayment: number;
  paymentPlan: "single" | "installment";
  emiMonths: number | null;
  kitProvided: boolean;
  kitCost: number | null;
};

// Builds the tuition installment rows (one per EMI month, or a single row for
// a single-payment plan) plus the kit row when provided. Both anchor to
// `joiningDate`. Initial-payment rows are NOT produced here — they anchor to
// `admissionDate` and are generated at `createStudent`.
export const buildTuitionAndKitRows = (
  enrollment: EnrollmentSnapshot,
  joiningDate: Date
): (typeof payments.$inferInsert)[] => {
  const remainingFees = enrollment.totalFees - enrollment.initialPayment;
  const installmentCount =
    enrollment.paymentPlan === "installment" && enrollment.emiMonths
      ? enrollment.emiMonths
      : 1;
  const baseInstallment = Math.floor(remainingFees / installmentCount);
  const remainder = remainingFees - baseInstallment * installmentCount;

  const tuitionRows: (typeof payments.$inferInsert)[] = Array.from(
    { length: installmentCount },
    (_, index) => {
      const isLast = index === installmentCount - 1;
      return {
        studentId: enrollment.studentId,
        enrollmentId: enrollment.enrollmentId,
        amount: baseInstallment + (isLast ? remainder : 0),
        emiNumber: installmentCount === 1 ? null : index + 1,
        paymentStatus: "unpaid" as const,
        dueDate: formatDateForPg(addMonthsClamped(joiningDate, index)),
      };
    }
  );

  if (enrollment.kitProvided && typeof enrollment.kitCost === "number") {
    const joiningDateString = formatDateForPg(joiningDate);
    tuitionRows.push({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.enrollmentId,
      amount: enrollment.kitCost,
      description: "Kit",
      paymentType: "kit_fee" as const,
      emiNumber: null,
      paymentStatus:
        enrollment.kitCost === 0 ? ("paid" as const) : ("unpaid" as const),
      dueDate: joiningDateString,
      paidDate: enrollment.kitCost === 0 ? joiningDateString : null,
    });
  }

  return tuitionRows;
};
