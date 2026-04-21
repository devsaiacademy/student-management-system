"use client";

import { Button } from "@student-management-system/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";

import { trpc } from "@/utils/trpc";

type NotifyUserButtonProps = {
  paymentId: number;
  studentId: number;
  notifiedAt: string | null;
};

const DEBOUNCE_MS = 60_000;

export function NotifyUserButton({
  paymentId,
  studentId,
  notifiedAt,
}: NotifyUserButtonProps) {
  const queryClient = useQueryClient();

  const notifiedAtMs = notifiedAt ? Date.parse(notifiedAt) : null;
  const withinDebounce =
    notifiedAtMs !== null && Date.now() - notifiedAtMs < DEBOUNCE_MS;

  const sendReminder = useMutation(
    trpc.payments.sendPaymentReminder.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("Reminder sent", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: "An email has been sent to the student.",
          timing: { displayDuration: 4000 },
        });
        queryClient.invalidateQueries({
          queryKey: trpc.payments.getStudentPayments.queryOptions({ studentId })
            .queryKey,
        });
      },
      onError: (error) => {
        gooeyToast.error("Failed to send reminder", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    })
  );

  return (
    <Button
      className="h-8 rounded-md px-3 text-[12px] font-medium"
      disabled={sendReminder.isPending || withinDebounce}
      onClick={() => sendReminder.mutate({ paymentId })}
      size="sm"
      variant="white"
    >
      {sendReminder.isPending ? "Sending..." : "Notify"}
    </Button>
  );
}
