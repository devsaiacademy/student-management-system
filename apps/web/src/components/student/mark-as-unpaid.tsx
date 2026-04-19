"use client";

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
import { Textarea } from "@student-management-system/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

type Payment = {
  id: number;
  label: string;
  amount: number;
  dueDate: string;
};

type MarkAsUnpaidProps = {
  studentId: number;
  payment: Payment;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
};

export function MarkAsUnpaid({
  studentId,
  payment,
  formatCurrency,
  formatDate,
}: MarkAsUnpaidProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState<string>("");

  const REASON_MAX_LENGTH = 500;

  const markUnpaid = useMutation(
    trpc.payments.markPaymentAsUnpaid.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("Payment reverted to unpaid", {
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
        setReason("");
      },
      onError: (error) => {
        gooeyToast.error("Failed to revert payment", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    })
  );

  const handleConfirm = () => {
    const trimmedReason = reason.trim();
    markUnpaid.mutate({
      paymentId: payment.id,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
    });
  };

  return (
    <>
      <Button
        className="h-8 rounded-md px-3 text-[12px] font-medium"
        size="sm"
        variant="white"
        onClick={() => {
          setReason("");
          setDialogOpen(true);
        }}
      >
        Mark Unpaid
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Revert Payment to Unpaid</DialogTitle>
            <DialogDescription>
              This will clear the paid date and payment method.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Installment
                </p>
                <p className="mt-0.5 font-medium">{payment.label}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Amount
                </p>
                <p className="mt-0.5 font-medium">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Due Date
                </p>
                <p className="mt-0.5 font-medium">
                  {formatDate(payment.dueDate)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                className="text-[12px] font-medium"
                htmlFor="mark-unpaid-reason"
              >
                Reason{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="mark-unpaid-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Enter the reason for reverting the payment"
                maxLength={REASON_MAX_LENGTH}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="ml-auto rounded-[5px] max-w-fit"
              variant="blue"
              size="sm"
              onClick={handleConfirm}
              disabled={markUnpaid.isPending}
            >
              {markUnpaid.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
