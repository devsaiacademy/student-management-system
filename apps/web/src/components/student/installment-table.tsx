"use client";

import { Badge } from "@student-management-system/ui/components/badge";
import { Button } from "@student-management-system/ui/components/button";
import { cn } from "@student-management-system/ui/lib/utils";

type Payment = {
  id: number;
  enrollmentId: number;
  amount: number;
  emiNumber: number | null;
  dueDate: string;
  paidDate: string | null;
  paymentStatus: string;
};

type InstallmentTableProps = {
  payments: Payment[];
  enrollmentCourse: string;
  totalPayments: number;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}

export function InstallmentTable({
  payments,
  enrollmentCourse,
  totalPayments,
}: InstallmentTableProps) {
  return (
    <div className="mt-6">
      <div className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_0.8fr_0.6fr] items-center gap-4 border-b border-border px-6 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Installment
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Course
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Due Date
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Amount
        </span>
        <span />
      </div>

      {payments.map((payment, index) => {
        const isPaid = payment.paymentStatus === "paid";
        const label = payment.emiNumber
          ? `Payment ${payment.emiNumber} of ${totalPayments}`
          : "Full Payment";

        return (
          <div
            key={payment.id}
            className={cn(
              "grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_0.8fr_0.6fr] items-center gap-4 border-b border-border px-6 py-4",
              "transition-colors duration-150 hover:bg-muted/30",
              "animate-in fade-in slide-in-from-bottom-1"
            )}
            style={{
              animationDelay: `${index * 80}ms`,
              animationFillMode: "backwards",
            }}
          >
            <span className="text-sm text-foreground">{label}</span>
            <span className="text-sm text-foreground">{enrollmentCourse}</span>
            <span className="text-sm text-foreground">
              {formatDate(payment.dueDate)}
            </span>
            <div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-xs",
                  isPaid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {isPaid ? "Paid" : "Unpaid"}
              </Badge>
            </div>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(payment.amount)}
            </span>
            <div>
              {isPaid ? (
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  View
                </Button>
              ) : (
                <Button size="sm" variant="blue" className="h-8 text-xs">
                  Pay
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
