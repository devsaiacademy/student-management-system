"use client";

import { type StudentStatus } from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

type StatusTransition = {
  nextStatus: StudentStatus;
  label: string;
};

const buttonStylesByStatus: Record<StudentStatus, string> = {
  pending:
    "h-8 rounded-md border-none bg-surface-warning px-3 text-xs text-surface-warning-foreground hover:brightness-95",
  active:
    "h-8 rounded-md border-none bg-surface-success px-3 text-xs text-surface-success-foreground hover:brightness-95",
  in_active:
    "h-8 rounded-md border-none bg-surface-warning px-3 text-xs text-surface-warning-foreground hover:brightness-95",
  discontinue:
    "h-8 rounded-md border-none bg-surface-destructive px-3 text-xs text-surface-destructive-foreground hover:brightness-95",
};

// A `pending` student transitions to `active` automatically when an admin
// sets the joining date — we don't expose a manual "activate without setting
// joining date" path because it would leave the schedule unanchored. Only
// the cancellation path is offered manually from pending.
const statusTransitions: Record<StudentStatus, StatusTransition[]> = {
  pending: [{ nextStatus: "discontinue", label: "Mark as discontinued" }],
  active: [
    { nextStatus: "in_active", label: "Mark as inactive" },
    { nextStatus: "discontinue", label: "Mark as discontinued" },
  ],
  in_active: [
    { nextStatus: "active", label: "Mark as active" },
    { nextStatus: "discontinue", label: "Mark as discontinued" },
  ],
  discontinue: [{ nextStatus: "active", label: "Mark as active" }],
};

const statusLabelByStatus: Record<StudentStatus, string> = {
  pending: "Pending",
  active: "Active",
  in_active: "Inactive",
  discontinue: "Discontinued",
};

export function ChangeStudentStatus({
  currentStudentStatus,
  id,
}: {
  currentStudentStatus: StudentStatus;
  id: number;
}) {
  const queryClient = useQueryClient();
  const nextStatuses = statusTransitions[currentStudentStatus] || [];

  // Tracks which status the user clicked so we can avoid “both buttons updating”.
  const [optimisticStatus, setOptimisticStatus] = useState<StudentStatus | null>(
    null,
  );

  const changeStatus = useMutation(
    trpc.students.changeStudentStatus.mutationOptions({
      onMutate: ({ changeStatusTo }) => {
        setOptimisticStatus(changeStatusTo);
        // Intentionally do NOT do optimistic cache updates.
        // We only show a loader for the clicked button and rely on invalidation for correctness.
      },
      onSuccess: (_data, variables) => {
        const nextStatus = variables.changeStatusTo;
        gooeyToast.success("Student status updated", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: (
            <div className="w-full text-center">
              Student marked as {statusLabelByStatus[nextStatus]}.
            </div>
          ),
          timing: { displayDuration: 4000 },
        });
        setOptimisticStatus(null);
        queryClient.invalidateQueries({
          queryKey: trpc.students.getStudentInfo.queryOptions({ studentId: id })
            .queryKey,
        });
      },
      onError: (error) => {
        setOptimisticStatus(null);
        gooeyToast.error("Failed to update status", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    }),
  );

  return (
    <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
      {nextStatuses.map((status) => (
        <Button
          variant="white"
          size="sm"
          className={buttonStylesByStatus[status.nextStatus]}
          key={status.nextStatus}
          onClick={() =>
            changeStatus.mutate({ studentId: id, changeStatusTo: status.nextStatus })
          }
          disabled={changeStatus.isPending}
        >
          {changeStatus.isPending && optimisticStatus === status.nextStatus
            ? "Updating..."
            : status.label}
        </Button>
      ))}
    </div>
  );
}
