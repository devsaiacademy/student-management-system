"use client";

import { PAYMENT_METHODS } from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@student-management-system/ui/components/dialog";
import { Label } from "@student-management-system/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

type StudentPaymentProps = {
  isAdmin: boolean;
  studentId: number;
};

type SelectedPayment = {
  id: number;
  label: string;
  amount: number;
  dueDate: string;
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

export function StudentPayment({ isAdmin, studentId }: StudentPaymentProps) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<SelectedPayment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const { data, isPending, isError } = useQuery(
    trpc.payments.getStudentPayments.queryOptions({ studentId })
  );

  const markPaid = useMutation(
    trpc.payments.markPaymentAsPaid.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("Payment marked as paid", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: "The payment status has been updated successfully.",
          timing: { displayDuration: 4000 },
        });
        queryClient.invalidateQueries({
          queryKey: trpc.payments.getStudentPayments.queryOptions({ studentId })
            .queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.enrollments.getStudentEnrollment.queryOptions({
            studentId,
          }).queryKey,
        });
        setDialogOpen(false);
        setSelectedPayment(null);
        setPaymentMethod("");
      },
      onError: (error) => {
        gooeyToast.error("Failed to mark payment", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    })
  );

  const handleOpenDialog = (payment: SelectedPayment) => {
    setSelectedPayment(payment);
    setPaymentMethod("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedPayment || !paymentMethod) return;
    markPaid.mutate({
      paymentId: selectedPayment.id,
      paymentMethod: paymentMethod as "cash" | "razorpay" | "others",
    });
  };

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
              <div className="flex gap-2">
                {isPaid ? (
                  <Button
                    className="h-8 rounded-md bg-muted px-4 text-[12px] font-medium text-muted-foreground hover:bg-muted/80"
                    size="sm"
                    variant="ghost"
                  >
                    View
                  </Button>
                ) : (
                  <>
                    <Button
                      className="h-8 rounded-md px-5 text-[12px] font-medium"
                      size="sm"
                      variant="blue"
                    >
                      Pay
                    </Button>
                    {isAdmin && (
                      <Button
                        className="h-8 rounded-md px-3 text-[12px] font-medium"
                        size="sm"
                        variant="white"
                        onClick={() =>
                          handleOpenDialog({
                            id: payment.id,
                            label,
                            amount: payment.amount,
                            dueDate: payment.dueDate,
                          })
                        }
                      >
                        Mark Paid
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedPayment(null);
            setPaymentMethod("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Payment as Paid</DialogTitle>
            <DialogDescription>
              Confirm that this payment has been received. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Installment
                  </p>
                  <p className="mt-0.5 font-medium">{selectedPayment.label}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Amount
                  </p>
                  <p className="mt-0.5 font-medium">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Due Date
                  </p>
                  <p className="mt-0.5 font-medium">
                    {formatDate(selectedPayment.dueDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-medium">
                  Payment Method <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value ?? "")}
                >
                  <SelectTrigger className="h-9 w-full rounded-[8px]">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-[6px]"
                    alignItemWithTrigger={false}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              className="rounded-[5px]"
              variant="white"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={markPaid.isPending}
            >
              Cancel
            </Button>
            <Button
              className="rounded-[5px]"
              variant="blue"
              size="sm"
              onClick={handleConfirm}
              disabled={!paymentMethod || markPaid.isPending}
            >
              {markPaid.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
