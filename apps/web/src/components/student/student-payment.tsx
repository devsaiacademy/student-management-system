"use client";

import { Badge } from "@student-management-system/ui/components/badge";
import { Button } from "@student-management-system/ui/components/button";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

type StudentPaymentProps = {
  studentId: number;
};

const ROW_GRID =
  "grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_0.8fr_0.6fr] items-center gap-4 px-6";

const HEADER_LABELS = [
  "Installment",
  "Course",
  "Due Date",
  "Status",
  "Amount",
] as const;

const SKELETON_ROW_COUNT = 4;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}

export function StudentPayment({ studentId }: StudentPaymentProps) {
  const { data, isPending, isError } = useQuery(
    trpc.billing.getStudentPayments.queryOptions({ studentId })
  );

  return (
    <div className="mt-6">
      <div className={cn(ROW_GRID, "border-b border-border py-3")}>
        {HEADER_LABELS.map((label) => (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            key={label}
          >
            {label}
          </span>
        ))}
        <span />
      </div>

      {isPending &&
        Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
          <div
            className={cn(ROW_GRID, "border-b border-border py-4")}
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
            key={index}
          >
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        ))}

      {isError && !isPending && (
        <div className="px-6 py-8 text-center text-sm text-destructive">
          Failed to load payments.
        </div>
      )}

      {!(isPending || isError) && data && data.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
          No payments found.
        </div>
      )}

      {!(isPending || isError) &&
        data &&
        data.map((payment, index) => {
          const isPaid = payment.paymentStatus === "paid";
          const label = payment.emiNumber
            ? `Payment ${payment.emiNumber} of ${data.length}`
            : "Full Payment";

          return (
            <div
              className={cn(
                ROW_GRID,
                "border-b border-border py-4 transition-colors duration-150 hover:bg-muted/30",
                "animate-in fade-in slide-in-from-bottom-1"
              )}
              key={payment.id}
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: "backwards",
              }}
            >
              <span className="text-sm text-foreground">{label}</span>
              <span className="text-sm text-foreground">{payment.course}</span>
              <span className="text-sm text-foreground">
                {formatDate(payment.dueDate)}
              </span>
              <div>
                <Badge
                  className={cn(
                    "rounded-full text-xs",
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  )}
                  variant="outline"
                >
                  {isPaid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(payment.amount)}
              </span>
              <div>
                {isPaid ? (
                  <Button className="h-8 text-xs" size="sm" variant="outline">
                    View
                  </Button>
                ) : (
                  <Button className="h-8 text-xs" size="sm" variant="blue">
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
