"use client";

import { Button } from "@student-management-system/ui/components/button";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

type StudentPaymentProps = {
  studentId: number;
};

const ROW_GRID =
  "grid grid-cols-[1.3fr_1.5fr_1fr_0.9fr_0.9fr_0.7fr] items-center gap-4 px-2";

const HEADER_LABELS = [
  "Installment",
  "Course",
  "Due Date",
  "Status",
  "Amount",
] as const;

const SKELETON_ROW_COUNT = 4;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}

function StatusBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium",
        paid
          ? "bg-surface-success text-surface-success-foreground"
          : "bg-surface-destructive text-surface-destructive-foreground"
      )}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

export function StudentPayment({ studentId }: StudentPaymentProps) {
  const { data, isPending, isError } = useQuery(
    trpc.billing.getStudentPayments.queryOptions({ studentId })
  );

  return (
    <div>
      <div className={cn(ROW_GRID, "border-b border-border py-4")}>
        {HEADER_LABELS.map((label) => (
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
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
            className={cn(ROW_GRID, "border-b border-border py-5")}
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
            key={index}
          >
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        ))}

      {isError && !isPending && (
        <div className="px-2 py-10 text-center text-sm text-destructive">
          Failed to load payments.
        </div>
      )}

      {!(isPending || isError) && data && data.length === 0 && (
        <div className="px-2 py-10 text-center text-sm text-muted-foreground">
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
                "border-b border-border py-5 transition-colors duration-150 hover:bg-muted/30",
                "animate-in fade-in slide-in-from-bottom-1"
              )}
              key={payment.id}
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: "backwards",
              }}
            >
              <span className="text-[14px] text-foreground">{label}</span>
              <span className="text-[14px] text-foreground">
                {payment.course}
              </span>
              <span className="text-[14px] text-foreground">
                {formatDate(payment.dueDate)}
              </span>
              <div>
                <StatusBadge paid={isPaid} />
              </div>
              <span className="text-[14px] text-foreground">
                {formatCurrency(payment.amount)}
              </span>
              <div>
                {isPaid ? (
                  <Button
                    className="h-8 rounded-md bg-muted px-4 text-[12px] font-medium text-muted-foreground hover:bg-muted/80"
                    size="sm"
                    variant="ghost"
                  >
                    View
                  </Button>
                ) : (
                  <Button
                    className="h-8 rounded-md px-5 text-[12px] font-medium"
                    size="sm"
                    variant="blue"
                  >
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
