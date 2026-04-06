"use client";

import {
  Card,
  CardContent,
} from "@student-management-system/ui/components/card";
import { cn } from "@student-management-system/ui/lib/utils";

type Enrollment = {
  id: number;
  course: string;
  level: string;
  duration: string;
  totalFees: number;
  paymentPlan: string;
  emiMonths: number | null;
  createdAt: Date;
};

type Payment = {
  id: number;
  enrollmentId: number;
  amount: number;
  emiNumber: number | null;
  dueDate: string;
  paidDate: string | null;
  paymentStatus: string;
};

type EnrollmentOverviewProps = {
  enrollment: Enrollment;
  payments: Payment[];
  activeEnrollmentId: number;
  onSelectEnrollment: (id: number) => void;
};

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}

export function EnrollmentOverview({
  enrollment,
  payments,
}: EnrollmentOverviewProps) {
  const enrollmentPayments = payments.filter(
    (p) => p.enrollmentId === enrollment.id
  );
  const paidPayments = enrollmentPayments.filter(
    (p) => p.paymentStatus === "paid"
  );
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = enrollmentPayments.length;
  const nextUnpaid = enrollmentPayments.find(
    (p) => p.paymentStatus === "unpaid"
  );

  const endDate = new Date(enrollment.createdAt);
  const durationMonths = Number.parseInt(enrollment.duration) || 6;
  endDate.setMonth(endDate.getMonth() + durationMonths);

  return (
    <div
      className="flex gap-4 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationFillMode: "backwards" }}
    >
      <Card className="flex-1 rounded-lg border border-border shadow-none">
        <CardContent className="grid grid-cols-3 gap-y-5 p-6">
          <div className="col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Enrolled Course
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {enrollment.course}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {enrollment.duration}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Level
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {enrollment.level}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Starts
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatDate(enrollment.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Fee
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatCurrency(enrollment.totalFees)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plan
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {enrollment.paymentPlan === "single"
                ? "Single payment"
                : `${enrollment.emiMonths} split payments`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "w-[260px] shrink-0 rounded-lg border border-border shadow-none",
          "border-l-4 border-l-primary"
        )}
      >
        <CardContent className="flex h-full flex-col justify-center p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Progress
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {paidPayments.length} of {totalPayments} paid
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {formatCurrency(totalPaid)} paid so far.
            {nextUnpaid && (
              <> Next installment due on {formatDate(nextUnpaid.dueDate)}.</>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
