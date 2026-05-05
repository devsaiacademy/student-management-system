"use client";

import { Button } from "@student-management-system/ui/components/button";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { trpc } from "@/utils/trpc";

import { MarkAsPaid } from "./mark-as-paid";
import { MarkAsUnpaid } from "./mark-as-unpaid";
import { NotifyUserButton } from "./notify-user-button";
import { PayButton } from "./pay-button";

type StudentPaymentProps = {
  isAdmin: boolean;
  studentId: number;
};

type Payment = {
  id: number;
  course: string;
  dueDate: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  emiNumber: number | null;
  description: string | null;
  metaData: {
    overdueNotifiedAt?: string;
    overdueEmailStatus?: "sent" | "failed";
  } | null;
};

const ROW_GRID =
  "grid grid-cols-[1.3fr_1.5fr_1fr_0.9fr_0.9fr_1.2fr] items-center gap-4 px-2";

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
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "paid";
  const isOverdue = status === "overdue";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        isPaid && "bg-surface-success text-surface-success-foreground",
        isOverdue && "bg-red-600 text-white",
        !(isPaid || isOverdue) &&
          "bg-surface-destructive text-surface-destructive-foreground"
      )}
    >
      {isPaid ? "Paid" : isOverdue ? "Overdue" : "Unpaid"}
    </span>
  );
}

function useRefreshingNow(intervalMs: number) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function StatusCell({
  status,
  notifiedAt,
}: {
  status: string;
  notifiedAt: string | null;
}) {
  useRefreshingNow(30_000);
  const showNotified = status !== "paid" && notifiedAt;
  const relative = showNotified
    ? formatDistanceToNow(Date.parse(notifiedAt), { addSuffix: true })
    : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge status={status} />
      {relative && (
        <span className="whitespace-nowrap text-xs leading-tight text-muted-foreground">
          Notified {relative}
        </span>
      )}
    </div>
  );
}

function getInstallmentLabel(payment: Payment, total: number) {
  if (payment.description === "Kit") {
    return "Kit";
  }
  return payment.emiNumber
    ? `Payment ${payment.emiNumber} of ${total}`
    : `${payment.description || "Full payment "}`;
}

type PaymentActionsProps = {
  payment: Payment;
  label: string;
  isPaid: boolean;
  isAdmin: boolean;
  studentId: number;
};

function PaymentActions({
  payment,
  label,
  isPaid,
  isAdmin,
  studentId,
}: PaymentActionsProps) {
  if (isPaid) {
    const canRevert = isAdmin && payment.paymentMethod !== "razorpay";
    return (
      <>
        <Button
          className="h-8 rounded-md bg-muted px-4 text-xs font-medium text-muted-foreground hover:bg-muted/80"
          size="sm"
          variant="ghost"
        >
          View
        </Button>
        {canRevert && (
          <MarkAsUnpaid
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            payment={{
              id: payment.id,
              label,
              amount: payment.amount,
              dueDate: payment.dueDate,
            }}
            studentId={studentId}
          />
        )}
      </>
    );
  }
  return (
    <>
      <PayButton paymentId={payment.id} studentId={studentId} />
      {isAdmin && (
        <>
          <MarkAsPaid
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            payment={{
              id: payment.id,
              label,
              amount: payment.amount,
              dueDate: payment.dueDate,
            }}
            studentId={studentId}
          />
          <NotifyUserButton
            notifiedAt={payment.metaData?.overdueNotifiedAt ?? null}
            paymentId={payment.id}
            studentId={studentId}
          />
        </>
      )}
    </>
  );
}

function MobileRow(props: PaymentActionsProps) {
  const { payment, label, isPaid, isAdmin, studentId } = props;
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-3">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {label}
            </span>
            <StatusBadge status={payment.paymentStatus} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(payment.amount)}
          </span>
          {payment.paymentStatus !== "paid" &&
            payment.metaData?.overdueNotifiedAt && (
              <span className="text-xs text-muted-foreground">
                Notified{" "}
                {formatDistanceToNow(
                  Date.parse(payment.metaData.overdueNotifiedAt),
                  { addSuffix: true }
                )}
              </span>
            )}
        </div>
        {isPaid ? (
          <Button
            className="h-8 rounded-md bg-muted px-4 text-xs font-medium text-muted-foreground hover:bg-muted/80"
            size="sm"
            variant="ghost"
          >
            View
          </Button>
        ) : (
          <PayButton paymentId={payment.id} studentId={studentId} />
        )}
        <button
          aria-expanded={open}
          aria-label="Toggle payment details"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </div>
      <div
        aria-hidden={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "mt-3 flex flex-col gap-2 pl-1 text-sm transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Course</span>
              <span className="text-foreground">{payment.course}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Due Date</span>
              <span className="text-foreground">
                {formatDate(payment.dueDate)}
              </span>
            </div>
            {!isPaid && isAdmin && (
              <div className="mt-1 flex flex-wrap gap-2">
                <MarkAsPaid
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  payment={{
                    id: payment.id,
                    label,
                    amount: payment.amount,
                    dueDate: payment.dueDate,
                  }}
                  studentId={studentId}
                />
                <NotifyUserButton
                  notifiedAt={payment.metaData?.overdueNotifiedAt ?? null}
                  paymentId={payment.id}
                  studentId={studentId}
                />
              </div>
            )}
            {isPaid && isAdmin && payment.paymentMethod !== "razorpay" && (
              <div className="mt-1 flex flex-wrap gap-2">
                <MarkAsUnpaid
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  payment={{
                    id: payment.id,
                    label,
                    amount: payment.amount,
                    dueDate: payment.dueDate,
                  }}
                  studentId={studentId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentPayment({ isAdmin, studentId }: StudentPaymentProps) {
  const { data, isPending, isError } = useQuery(
    trpc.payments.getStudentPayments.queryOptions({ studentId })
  );

  return (
    <div>
      <div
        className={cn(ROW_GRID, "hidden border-b border-border py-4 md:grid")}
      >
        {HEADER_LABELS.map((label) => (
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em] text-primary"
            key={label}
          >
            {label}
          </span>
        ))}
        <span />
      </div>

      {isPending && (
        <>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <div
              className={cn(
                ROW_GRID,
                "hidden border-b border-border py-5 md:grid"
              )}
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              key={`desktop-${index}`}
            >
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <div
              className="flex flex-col gap-2 border-b border-border py-4 md:hidden"
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              key={`mobile-${index}`}
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          ))}
        </>
      )}

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
        (() => {
          const installmentTotal = data.filter(
            (p) => p.description !== "Kit"
          ).length;
          return data.map((payment, index) => {
            const isPaid = payment.paymentStatus === "paid";
            const label = getInstallmentLabel(payment, installmentTotal);

            return (
              <div key={payment.id}>
                <div
                  className={cn(
                    ROW_GRID,
                    "hidden border-b border-border py-5 transition-colors duration-150 hover:bg-muted/30 md:grid",
                    "animate-in fade-in slide-in-from-bottom-1"
                  )}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <span className="text-sm text-foreground">{label}</span>
                  <span className="text-sm text-foreground">
                    {payment.course}
                  </span>
                  <span className="text-sm text-foreground">
                    {formatDate(payment.dueDate)}
                  </span>
                  <StatusCell
                    notifiedAt={payment.metaData?.overdueNotifiedAt ?? null}
                    status={payment.paymentStatus}
                  />
                  <span className="text-sm text-foreground">
                    {formatCurrency(payment.amount)}
                  </span>
                  <div className="flex items-center justify-start gap-2">
                    <PaymentActions
                      isAdmin={isAdmin}
                      isPaid={isPaid}
                      label={label}
                      payment={payment}
                      studentId={studentId}
                    />
                  </div>
                </div>
                <div className="md:hidden">
                  <MobileRow
                    isAdmin={isAdmin}
                    isPaid={isPaid}
                    label={label}
                    payment={payment}
                    studentId={studentId}
                  />
                </div>
              </div>
            );
          });
        })()}
    </div>
  );
}
