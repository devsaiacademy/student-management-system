"use client";

import { type StudentStatus } from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@student-management-system/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  type LucideIcon,
  PauseCircle,
} from "lucide-react";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

type StatusTransition = {
  nextStatus: StudentStatus;
  label: string;
};

type TransitionVisual = {
  icon: LucideIcon;
  color: string;
  // Full literal class so Tailwind can statically extract the arbitrary
  // animation variant (template-built class names are never scanned).
  animationClass: string;
};

const transitionVisuals: Record<StudentStatus, TransitionVisual> = {
  pending: {
    icon: PauseCircle,
    color: "#64748b",
    animationClass:
      "group-hover/dropdown-menu-item:[animation:pop_0.5s_ease-in-out]",
  },
  active: {
    icon: CheckCircle2,
    color: "#16a34a",
    animationClass:
      "group-hover/dropdown-menu-item:[animation:pop_0.5s_ease-in-out]",
  },
  in_active: {
    icon: PauseCircle,
    color: "#f59e0b",
    animationClass:
      "group-hover/dropdown-menu-item:[animation:pop_0.5s_ease-in-out]",
  },
  discontinue: {
    icon: Ban,
    color: "#dc2626",
    animationClass:
      "group-hover/dropdown-menu-item:[animation:wiggle_0.5s_ease-in-out]",
  },
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

  const changeStatus = useMutation(
    trpc.students.changeStudentStatus.mutationOptions({
      onSuccess: (_data, variables) => {
        const nextStatus = variables.changeStatusTo;
        notify.success(`Student marked as ${statusLabelByStatus[nextStatus]}`);
        queryClient.invalidateQueries({
          queryKey: trpc.students.getStudentInfo.queryOptions({ studentId: id })
            .queryKey,
        });
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  if (nextStatuses.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Change student status"
            className="h-8 rounded-md px-3 text-xs font-medium"
            disabled={changeStatus.isPending}
            size="sm"
            variant="white"
          >
            {changeStatus.isPending ? "Updating…" : "Actions"}
            <ChevronDown aria-hidden className="ml-1 size-3.5" />
          </Button>
        }
      />
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="min-w-48">
          {nextStatuses.map((status) => {
            const visual = transitionVisuals[status.nextStatus];
            const Icon = visual.icon;
            return (
              <DropdownMenuItem
                key={status.nextStatus}
                onClick={() =>
                  changeStatus.mutate({
                    studentId: id,
                    changeStatusTo: status.nextStatus,
                  })
                }
              >
                <Icon className={visual.animationClass} color={visual.color} />
                {status.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
