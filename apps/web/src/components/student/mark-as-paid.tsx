"use client";

import { MANUAL_PAYMENT_METHODS } from "@student-management-system/db/schema/constants";
import type { ManualPaymentMethod } from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@student-management-system/ui/components/dialog";
import { Input } from "@student-management-system/ui/components/input";
import { Label } from "@student-management-system/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { Textarea } from "@student-management-system/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

type Payment = {
  id: number;
  label: string;
  amount: number;
  // Chunks already collected via Razorpay against this installment. When
  // present, the dialog shows the remaining (amount − amountPaid) and
  // captures only that as the manual collection.
  amountPaid?: number;
  dueDate: string;
};

type MarkAsPaidProps = {
  studentId: number;
  payment: Payment;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
  // Optional custom trigger. When omitted AND `open` is not supplied, the
  // standard "Mark Paid" button is rendered. Use `renderTrigger` for an inline
  // trigger, or `open`/`onOpenChange` to control the dialog from outside
  // (e.g. when the trigger lives in a dropdown that would unmount it).
  renderTrigger?: (open: () => void) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function MarkAsPaid({
  studentId,
  payment,
  formatCurrency,
  formatDate,
  renderTrigger,
  open: controlledOpen,
  onOpenChange,
}: MarkAsPaidProps) {
  const queryClient = useQueryClient();

  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = controlledOpen ?? internalOpen;
  const setDialogOpen = (next: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  // Empty string when untouched so we can detect "no value" and fall back to
  // the remaining default. Stored as string for input fidelity.
  const [amountInput, setAmountInput] = useState<string>("");

  const REASON_MAX_LENGTH = 500;

  const remaining = payment.amount - (payment.amountPaid ?? 0);
  const enteredAmount = amountInput === "" ? remaining : Number(amountInput);
  const amountInvalid =
    !Number.isFinite(enteredAmount) ||
    enteredAmount <= 0 ||
    enteredAmount > remaining;

  const markPaid = useMutation(
    trpc.payments.markPaymentAsPaid.mutationOptions({
      onSuccess: () => {
        notify.success("The payment status has been updated successfully");
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
        setPaymentMethod("");
        setReason("");
        setAmountInput("");
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  const handleConfirm = () => {
    if (!paymentMethod || amountInvalid) return;
    const trimmedReason = reason.trim();
    markPaid.mutate({
      paymentId: payment.id,
      paymentMethod: paymentMethod as ManualPaymentMethod,
      amount: enteredAmount,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
    });
  };

  const openDialog = () => {
    setPaymentMethod("");
    setReason("");
    setAmountInput("");
    setDialogOpen(true);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openDialog)
      ) : (
        <Button
          className="h-8 rounded-md px-3 text-xs font-medium"
          size="sm"
          variant="white"
          onClick={openDialog}
        >
          Mark Paid
        </Button>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setPaymentMethod("");
            setReason("");
            setAmountInput("");
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

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Installment
                </p>
                <p className="mt-0.5 font-medium">{payment.label}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {(payment.amountPaid ?? 0) > 0 ? "Remaining" : "Amount"}
                </p>
                <p className="mt-0.5 font-medium">
                  {formatCurrency(payment.amount - (payment.amountPaid ?? 0))}
                </p>
                {(payment.amountPaid ?? 0) > 0 && (
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    {formatCurrency(payment.amountPaid ?? 0)} already paid
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Due Date
                </p>
                <p className="mt-0.5 font-medium">
                  {formatDate(payment.dueDate)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium" htmlFor="mark-paid-amount">
                Amount Received <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mark-paid-amount"
                inputMode="numeric"
                max={remaining}
                min={1}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder={String(remaining)}
                type="number"
                value={amountInput}
              />
              <p className="text-[11px] text-muted-foreground">
                Up to {formatCurrency(remaining)} remaining. Defaults to the
                full remaining if blank.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">
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
                  {MANUAL_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium" htmlFor="mark-paid-reason">
                Reason{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="mark-paid-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Enter the reason for the mark as paid"
                maxLength={REASON_MAX_LENGTH}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {/* <Button
              className="rounded-[5px]"
              variant="white"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={markPaid.isPending}
            >
              Cancel
            </Button> */}
            <Button
              className="ml-auto rounded-[5px] max-w-fit"
              variant="blue"
              size="sm"
              onClick={handleConfirm}
              disabled={!paymentMethod || amountInvalid || markPaid.isPending}
            >
              {markPaid.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
