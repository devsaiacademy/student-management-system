"use client";

import { Button } from "@student-management-system/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { gooeyToast } from "goey-toast";
import { useEffect, useState } from "react";

import { trpc } from "@/utils/trpc";

type NotifyUserButtonProps = {
  paymentId: number;
  studentId: number;
  notifiedAt: string | null;
};

const DEBOUNCE_MS = 60_000;

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function NotifyUserButton({
  paymentId,
  studentId,
  notifiedAt,
}: NotifyUserButtonProps) {
  const queryClient = useQueryClient();
  const now = useNow(30_000);

  const notifiedAtMs = notifiedAt ? Date.parse(notifiedAt) : null;
  const withinDebounce =
    notifiedAtMs !== null && now - notifiedAtMs < DEBOUNCE_MS;

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

  const lastNotifiedLabel = notifiedAtMs
    ? `Notified ${formatDistanceToNow(notifiedAtMs, { addSuffix: true })}`
    : null;

  return (
    <div className="flex items-center gap-2">
      <Button
        className="h-8 rounded-md px-3 text-[12px] font-medium"
        disabled={sendReminder.isPending || withinDebounce}
        onClick={() => sendReminder.mutate({ paymentId })}
        size="sm"
        variant="white"
      >
        {sendReminder.isPending ? "Sending..." : "Notify"}
      </Button>
      {lastNotifiedLabel && (
        <span className="text-[11px] text-muted-foreground">
          {lastNotifiedLabel}
        </span>
      )}
    </div>
  );
}
