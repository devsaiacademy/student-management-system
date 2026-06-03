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
import { Input } from "@student-management-system/ui/components/input";
import { Label } from "@student-management-system/ui/components/label";
import { Textarea } from "@student-management-system/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

type AddPaymentProps = {
  studentId: number;
};

const DESCRIPTION_MAX_LENGTH = 255;

export function AddPayment({ studentId }: AddPaymentProps) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const resetForm = () => {
    setAmount("");
    setDueDate("");
    setDescription("");
  };

  const createPayment = useMutation(
    trpc.payments.createPayment.mutationOptions({
      onSuccess: () => {
        notify.success("The payment has been added to this student");
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
        resetForm();
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  const parsedAmount = Number.parseInt(amount, 10);
  const trimmedDescription = description.trim();
  const isFormValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    dueDate.length > 0 &&
    trimmedDescription.length > 0;

  const handleConfirm = () => {
    if (!isFormValid) {
      return;
    }
    createPayment.mutate({
      studentId,
      amount: parsedAmount,
      dueDate,
      description: trimmedDescription,
    });
  };

  return (
    <>
      <Button
        className="h-8 rounded-md px-3 text-xs font-medium"
        onClick={() => {
          resetForm();
          setDialogOpen(true);
        }}
        size="sm"
        variant="blue"
      >
        <Plus aria-hidden className="size-3.5" />
        Add Payment
      </Button>

      <Dialog
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        open={dialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Create an unpaid payment for this student. They can pay it later
              and you can mark it paid from the payments table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label
                className="text-xs font-medium"
                htmlFor="add-payment-amount"
              >
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-9 rounded-[8px]"
                id="add-payment-amount"
                inputMode="numeric"
                min={1}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 500"
                step={1}
                type="number"
                value={amount}
              />
            </div>

            <div className="space-y-2">
              <Label
                className="text-xs font-medium"
                htmlFor="add-payment-due-date"
              >
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-9 rounded-[8px]"
                id="add-payment-due-date"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </div>

            <div className="space-y-2">
              <Label
                className="text-xs font-medium"
                htmlFor="add-payment-description"
              >
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                className="rounded-[8px]"
                id="add-payment-description"
                maxLength={DESCRIPTION_MAX_LENGTH}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Late fee, extra session, materials"
                rows={3}
                value={description}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="ml-auto max-w-fit rounded-[5px]"
              disabled={!isFormValid || createPayment.isPending}
              onClick={handleConfirm}
              size="sm"
              variant="blue"
            >
              {createPayment.isPending ? "Adding..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
