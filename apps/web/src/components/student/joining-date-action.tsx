"use client";

import { Button } from "@student-management-system/ui/components/button";
import { Calendar } from "@student-management-system/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@student-management-system/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@student-management-system/ui/components/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarPlus, Pencil } from "lucide-react";
import { useState } from "react";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

type JoiningDateActionProps = {
  studentId: number;
  enrollmentId: number;
  admissionDate: string;
  joiningDate: string | null;
  isLocked: boolean;
};

export function JoiningDateAction({
  studentId,
  enrollmentId,
  admissionDate,
  joiningDate,
  isLocked,
}: JoiningDateActionProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const admissionDay = new Date(admissionDate);
  admissionDay.setHours(0, 0, 0, 0);
  const selectedDate = joiningDate ? new Date(joiningDate) : undefined;

  const setJoiningDate = useMutation(
    trpc.enrollments.setJoiningDate.mutationOptions({
      onSuccess: () => {
        notify.success(
          joiningDate
            ? "Outstanding tuition and kit due dates have been shifted"
            : "Tuition schedule has been generated"
        );
        setOpen(false);
        queryClient.invalidateQueries({
          queryKey: trpc.enrollments.getStudentEnrollment.queryOptions({
            studentId,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.students.getStudentInfo.queryOptions({ studentId })
            .queryKey,
        });
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

  const triggerLabel = joiningDate
    ? format(new Date(joiningDate), "dd/MM/yyyy")
    : "Set joining date";
  const TriggerIcon = joiningDate ? Pencil : CalendarPlus;

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      type="button"
      className="h-8 gap-1.5 rounded-[8px] border-input px-2.5 text-sm font-normal"
      disabled={isLocked || setJoiningDate.isPending}
    >
      <TriggerIcon aria-hidden className="size-3.5" />
      {setJoiningDate.isPending ? "Saving..." : triggerLabel}
    </Button>
  );

  if (isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger render={triggerButton} />
        <TooltipContent>
          Joining date is locked — a tuition or kit payment is already recorded
          or overdue. Mark it unpaid first to change the joining date.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={triggerButton} />
      <PopoverContent align="start" className="rounded-[8px] p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate ?? admissionDay}
          captionLayout="dropdown"
          disabled={(date) => date < admissionDay}
          onSelect={(date) => {
            if (date) {
              setJoiningDate.mutate({ enrollmentId, joiningDate: date });
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
