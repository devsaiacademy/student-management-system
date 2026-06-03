"use client";

import { Button } from "@student-management-system/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

type NotifyUserButtonProps = {
  paymentId: number;
  studentId: number;
  notifiedAt: string | null;
  // Optional custom trigger; defaults to the standard "Notify" button.
  renderTrigger?: (
    notify: () => void,
    state: { isPending: boolean; isDebounced: boolean }
  ) => React.ReactNode;
};

const DEBOUNCE_MS = 60_000;

export function NotifyUserButton({
  paymentId,
  studentId,
  notifiedAt,
  renderTrigger,
}: NotifyUserButtonProps) {
  const queryClient = useQueryClient();

  const notifiedAtMs = notifiedAt ? Date.parse(notifiedAt) : null;
  const withinDebounce =
    notifiedAtMs !== null && Date.now() - notifiedAtMs < DEBOUNCE_MS;

  const sendReminder = useMutation(
    trpc.payments.sendPaymentReminder.mutationOptions({
      onSuccess: () => {
        notify.success("An email has been sent to the student");
        queryClient.invalidateQueries({
          queryKey: trpc.payments.getStudentPayments.queryOptions({ studentId })
            .queryKey,
        });
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  const handleNotify = () => sendReminder.mutate({ paymentId });

  if (renderTrigger) {
    return (
      <>
        {renderTrigger(handleNotify, {
          isPending: sendReminder.isPending,
          isDebounced: withinDebounce,
        })}
      </>
    );
  }

  return (
    <Button
      className="h-8 rounded-md px-3 text-xs font-medium"
      disabled={sendReminder.isPending || withinDebounce}
      onClick={handleNotify}
      size="sm"
      variant="white"
    >
      {sendReminder.isPending ? "Sending..." : "Notify"}
    </Button>
  );
}
