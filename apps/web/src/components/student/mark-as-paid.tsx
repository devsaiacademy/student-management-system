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
import { Label } from "@student-management-system/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
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

type MarkAsPaidProps = {
  studentId: number;
  payment: Payment;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
};

export function MarkAsPaid({
  studentId,
  payment,
  formatCurrency,
  formatDate,
}: MarkAsPaidProps) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

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

  const handleConfirm = () => {
    if (!paymentMethod) return;
    markPaid.mutate({
      paymentId: payment.id,
      paymentMethod: paymentMethod as ManualPaymentMethod,
    });
  };

  return (
    <>
      <Button
        className="h-8 rounded-md px-3 text-[12px] font-medium"
        size="sm"
        variant="white"
        onClick={() => {
          setPaymentMethod("");
          setDialogOpen(true);
        }}
      >
        Mark Paid
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
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
                  {MANUAL_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
    </>
  );
}
