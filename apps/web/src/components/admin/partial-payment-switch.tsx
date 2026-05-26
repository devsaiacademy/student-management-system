"use client";

import { Switch } from "@student-management-system/ui/components/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

type PartialPaymentSwitchProps = {
  paymentId: number;
  studentId: number;
  enabled: boolean;
  // Locked once any chunk has been collected — Razorpay won't let us flip
  // partial_payment on an in-flight order.
  locked: boolean;
};

export function PartialPaymentSwitch({
  paymentId,
  studentId,
  enabled,
  locked,
}: PartialPaymentSwitchProps) {
  const queryClient = useQueryClient();
  const [optimistic, setOptimistic] = useState(enabled);

  const update = useMutation(
    trpc.razorpay.setPartialEnabled.mutationOptions({
      onSuccess: ({ enabled: next }) => {
        setOptimistic(next);
        queryClient.invalidateQueries({
          queryKey: trpc.payments.getStudentPayments.queryOptions({ studentId })
            .queryKey,
        });
        gooeyToast.success(
          next ? "Partial payment enabled" : "Partial payment disabled",
          {
            showTimestamp: false,
            borderColor: "#E0E0E0",
            borderWidth: 1.5,
            timing: { displayDuration: 3000 },
          }
        );
      },
      onError: (error) => {
        setOptimistic((prev) => !prev);
        gooeyToast.error("Couldn't update", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    })
  );

  const handleChange = (next: boolean) => {
    setOptimistic(next);
    update.mutate({ paymentId, enabled: next });
  };

  return (
    <label
      className="flex items-center gap-2 text-xs text-muted-foreground"
      title={
        locked
          ? "Locked — a partial chunk has already been paid"
          : "Allow this installment to be paid in parts"
      }
    >
      <span className="hidden md:inline">Partial</span>
      <Switch
        checked={optimistic}
        disabled={locked || update.isPending}
        onCheckedChange={handleChange}
      />
    </label>
  );
}
