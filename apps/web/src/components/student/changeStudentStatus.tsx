"use client";

import { type StudentStatus } from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";

import { trpc } from "@/utils/trpc";

type StatusTransition = {
  nextStatus: StudentStatus;
  label: string;
};

const buttonStylesByStatus: Record<StudentStatus, string> = {
  active:
    "h-8 rounded-md border-none bg-surface-success px-3 text-xs text-surface-success-foreground hover:brightness-95",
  in_active:
    "h-8 rounded-md border-none bg-surface-warning px-3 text-xs text-surface-warning-foreground hover:brightness-95",
  discontinue:
    "h-8 rounded-md border-none bg-surface-destructive px-3 text-xs text-surface-destructive-foreground hover:brightness-95",
};

const statusTransitions: Record<StudentStatus, StatusTransition[]> = {
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

export function ChangeStudentStatus({
  currentStudentStatus,
  id,
}: {
  currentStudentStatus: StudentStatus;
  id: number;
}) {
  const queryClient = useQueryClient();
  const nextStatuses = statusTransitions[currentStudentStatus] || [];
  const changeStatus = useMutation(
    trpc.students.changeStudentStatus.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("Student status updated", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: "The student's status was updated successfully.",
          timing: { displayDuration: 4000 },
        });
        queryClient.invalidateQueries({
          queryKey: trpc.students.getStudentInfo.queryOptions({ studentId: id })
            .queryKey,
        });
      },
      onError: (error) => {
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
          {changeStatus.isPending ? "Updating..." : status.label}
        </Button>
      ))}
    </div>
  );
}
