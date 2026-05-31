"use client";

import { Button } from "@student-management-system/ui/components/button";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { trpc } from "@/utils/trpc";

import { PaymentActionsMenu } from "../admin/payment-actions-menu";
import { PayButton } from "./pay-button";

type StudentPaymentProps = {
  isAdmin: boolean;
  studentId: number;
};

export type Payment = {
  id: number;
  course: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  partialPaymentEnabled: boolean;
  paymentStatus: string;
  paymentMethod: string | null;
  emiNumber: number | null;
  description: string | null;
  metaData: {
    overdueNotifiedAt?: string;
    overdueEmailStatus?: "sent" | "failed";
    penalty?: number;
  } | null;
};

const ROW_GRID =
  "grid grid-cols-[1.5fr_1fr_0.9fr_0.9fr_1.2fr] items-center gap-4 px-4";

const HEADER_LABELS = [
  "Installment",
  "Course",
  "Due Date",
  "Status",
  "Amount",
] as const;

const SKELETON_ROW_COUNT = 4;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "paid";
  const isOverdue = status === "overdue";
  const isPartial = status === "partially_paid";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        isPaid && "bg-surface-success text-surface-success-foreground",
        isOverdue && "bg-red-600 text-white",
        isPartial && "bg-amber-100 text-amber-900",
        !(isPaid || isOverdue || isPartial) &&
          "bg-surface-destructive text-surface-destructive-foreground"
      )}
    >
      {isPaid
        ? "Paid"
        : isOverdue
          ? "Overdue"
          : isPartial
            ? "Partially paid"
            : "Unpaid"}
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
  partialAllowed,
  showDetails,
}: {
  status: string;
  notifiedAt: string | null;
  partialAllowed: boolean;
  showDetails: boolean;
}) {
  useRefreshingNow(30_000);
  const showNotified = status !== "paid" && notifiedAt;
  const relative = showNotified
    ? formatDistanceToNow(Date.parse(notifiedAt), { addSuffix: true })
    : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge status={status} />
      {showDetails && partialAllowed && status !== "paid" && (
        <span className="whitespace-nowrap text-xs leading-tight text-blue-700">
          Partial payment enabled
        </span>
      )}
      {showDetails && relative && (
        <span className="whitespace-nowrap text-xs leading-tight text-muted-foreground">
          Notified {relative}
        </span>
      )}
    </div>
  );
}

function DetailsToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      aria-label="Show all details"
      aria-pressed={on}
      className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      onClick={() => onChange(!on)}
      type="button"
    >
      Show all info
      <span
        className={cn(
          "relative inline-block h-3.5 w-7 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 block size-2.5 rounded-full bg-white shadow-sm transition-transform",
            on ? "translate-x-[14px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function getInstallmentLabel(payment: Payment, total: number) {
  if (payment.description === "Kit") {
    return "Kit";
  }
  return payment.emiNumber
    ? `Payment ${payment.emiNumber} of ${total}`
    : `${payment.description || "Full payment "}`;
}

type PaymentActionsProps = {
  payment: Payment;
  totalAmount: number;
  label: string;
  isPaid: boolean;
  isAdmin: boolean;
  studentId: number;
  // When false, the secondary Actions dropdown is hidden — only the primary
  // Pay (or View) control renders. Defaults to true to keep existing call
  // sites (mobile expanded section, etc.) working.
  showSecondary?: boolean;
};

export function PaymentActions({
  payment,
  totalAmount,
  label,
  isPaid,
  isAdmin,
  studentId,
  showSecondary = true,
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
        {showSecondary && canRevert && (
          <PaymentActionsMenu
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            label={label}
            payment={payment}
            studentId={studentId}
            totalAmount={totalAmount}
          />
        )}
      </>
    );
  }
  return (
    <>
      <PayButton paymentId={payment.id} studentId={studentId} />
      {showSecondary && isAdmin && (
        <PaymentActionsMenu
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          label={label}
          payment={payment}
          studentId={studentId}
          totalAmount={totalAmount}
        />
      )}
    </>
  );
}

function MobileRow(
  props: PaymentActionsProps & { showDetails: boolean }
) {
  const {
    payment,
    totalAmount,
    label,
    isPaid,
    isAdmin,
    studentId,
    showDetails,
  } = props;
  const penalty = payment.metaData?.penalty ?? 0;
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border bg-white p-4 last:border-b-0">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {label}
            </span>
            <StatusBadge status={payment.paymentStatus} />
          </div>
          <span className="text-xs text-muted-foreground">
            {payment.amountPaid > 0 && !isPaid
              ? formatCurrency(totalAmount - payment.amountPaid)
              : formatCurrency(totalAmount)}
          </span>
          {showDetails && payment.amountPaid > 0 && !isPaid && (
            <span className="text-xs font-medium text-amber-700">
              {formatCurrency(payment.amountPaid)} paid of{" "}
              {formatCurrency(totalAmount)}
            </span>
          )}
          {showDetails && payment.partialPaymentEnabled && !isPaid && (
            <span className="text-xs font-medium text-blue-700">
              Partial payment enabled
            </span>
          )}
          {showDetails && penalty > 0 && !isPaid && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(payment.amount)} + {formatCurrency(penalty)} late
              fee
            </span>
          )}
          {showDetails &&
            payment.paymentStatus !== "paid" &&
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
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <PaymentActionsMenu
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  label={label}
                  payment={payment}
                  studentId={studentId}
                  totalAmount={totalAmount}
                />
              </div>
            )}
            {isPaid && isAdmin && payment.paymentMethod !== "razorpay" && (
              <div className="mt-1 flex flex-wrap gap-2">
                <PaymentActionsMenu
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  label={label}
                  payment={payment}
                  studentId={studentId}
                  totalAmount={totalAmount}
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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div
        className={cn(
          ROW_GRID,
          "hidden border-b border-border bg-muted/40 py-3 md:grid"
        )}
      >
        <span className="text-xs font-medium text-muted-foreground">
          Course
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Due Date
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Status
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Amount
        </span>
        <span className="flex justify-end">
          <DetailsToggle on={showDetails} onChange={setShowDetails} />
        </span>
      </div>

      <div className="flex justify-end border-b border-border bg-muted/40 px-4 py-2 md:hidden">
        <DetailsToggle on={showDetails} onChange={setShowDetails} />
      </div>

      {isPending && (
        <>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <div
              className={cn(
                ROW_GRID,
                "hidden border-b border-border bg-white py-5 last:border-b-0 md:grid"
              )}
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              key={`desktop-${index}`}
            >
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <div
              className="flex flex-col gap-2 border-b border-border bg-white p-4 last:border-b-0 md:hidden"
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
          return data.map((payment) => {
            const isPaid = payment.paymentStatus === "paid";
            const label = getInstallmentLabel(payment, installmentTotal);
            const penalty = payment.metaData?.penalty ?? 0;
            const totalAmount = payment.amount + penalty;

            return (
              <div key={payment.id}>
                <div className="hidden border-b border-border bg-white last:border-b-0 hover:bg-muted/30 md:block">
                  <p className="px-4 pt-4 text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <div className={cn(ROW_GRID, "py-3")}>
                    <span className="text-sm text-foreground">
                      {payment.course}
                    </span>
                  <span className="text-sm text-foreground">
                    {formatDate(payment.dueDate)}
                  </span>
                  <StatusCell
                    notifiedAt={payment.metaData?.overdueNotifiedAt ?? null}
                    partialAllowed={payment.partialPaymentEnabled}
                    showDetails={showDetails}
                    status={payment.paymentStatus}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-foreground">
                      {payment.amountPaid > 0 && !isPaid
                        ? formatCurrency(totalAmount - payment.amountPaid)
                        : formatCurrency(totalAmount)}
                    </span>
                    {showDetails &&
                      payment.amountPaid > 0 &&
                      !isPaid && (
                        <span className="text-xs font-medium text-amber-700">
                          {formatCurrency(payment.amountPaid)} paid of{" "}
                          {formatCurrency(totalAmount)}
                        </span>
                      )}
                    {showDetails && penalty > 0 && !isPaid && (
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(payment.amount)} +{" "}
                        {formatCurrency(penalty)} late fee
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <PaymentActions
                      isAdmin={isAdmin}
                      isPaid={isPaid}
                      label={label}
                      payment={payment}
                      showSecondary={showDetails}
                      studentId={studentId}
                      totalAmount={totalAmount}
                    />
                  </div>
                  </div>
                </div>
                <div className="md:hidden">
                  <MobileRow
                    isAdmin={isAdmin}
                    isPaid={isPaid}
                    label={label}
                    payment={payment}
                    showDetails={showDetails}
                    studentId={studentId}
                    totalAmount={totalAmount}
                  />
                </div>
              </div>
            );
          });
        })()}
    </div>
  );
}
