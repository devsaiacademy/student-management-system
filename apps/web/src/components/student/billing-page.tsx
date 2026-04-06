"use client";

import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { cn } from "@student-management-system/ui/lib/utils";
import { useState } from "react";

import { EnrollmentOverview } from "./enrollment-overview";
import { InstallmentTable } from "./installment-table";
import { StudentHeader } from "./student-header";

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
  paymentMethod: string;
};

type BillingPageProps = {
  student: {
    name: string;
    email: string;
    phoneNumber: string;
  };
  enrollments: Enrollment[];
  payments: Payment[];
};

export function BillingPage({
  student,
  enrollments,
  payments,
}: BillingPageProps) {
  const [activeEnrollmentId, setActiveEnrollmentId] = useState(
    enrollments[0]?.id ?? 0
  );

  const activeEnrollment = enrollments.find((e) => e.id === activeEnrollmentId);
  const activePayments = payments.filter(
    (p) => p.enrollmentId === activeEnrollmentId
  );

  if (!activeEnrollment) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        No enrollments found.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <StudentHeader student={student} />

      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          {enrollments.length > 1 && (
            <div className="mb-6 flex gap-1 border-b border-border">
              {enrollments.map((enrollment) => (
                <button
                  key={enrollment.id}
                  type="button"
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all duration-200",
                    activeEnrollmentId === enrollment.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveEnrollmentId(enrollment.id)}
                >
                  {enrollment.course}
                </button>
              ))}
            </div>
          )}

          {enrollments.length === 1 && (
            <div className="mb-6 border-b border-border">
              <span className="inline-block border-b-2 border-primary px-1 pb-2 text-sm font-medium text-primary">
                Overview
              </span>
            </div>
          )}

          <EnrollmentOverview
            activeEnrollmentId={activeEnrollmentId}
            enrollment={activeEnrollment}
            onSelectEnrollment={setActiveEnrollmentId}
            payments={payments}
          />

          <InstallmentTable
            enrollmentCourse={activeEnrollment.course}
            payments={activePayments}
            totalPayments={activePayments.length}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
