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
import { useMutation } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";

import { trpc } from "@/utils/trpc";

const TOAST_OPTS = {
  showTimestamp: false,
  borderColor: "#E0E0E0",
  borderWidth: 1.5,
  timing: { displayDuration: 4000 },
} as const;

type DeleteCourseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  course: { id: number; name: string } | null;
};

export function DeleteCourseDialog({
  onOpenChange,
  onSuccess,
  open,
  course,
}: DeleteCourseDialogProps) {
  const deleteMutation = useMutation(
    trpc.courses.delete.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("Course removed", { ...TOAST_OPTS });
        onSuccess();
      },
      onError: (err) => {
        gooeyToast.error("Failed to delete course", {
          ...TOAST_OPTS,
          description: err.message,
        });
      },
    })
  );

  function handleConfirm() {
    if (!course) {
      return;
    }
    deleteMutation.mutate({ id: course.id });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete course</DialogTitle>
          <DialogDescription>
            {course
              ? `Permanently remove "${course.name}". Existing enrollments keep their course label, but it won't appear in the Add Student dropdown anymore. This cannot be undone.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="h-10 rounded-[8px] px-4 text-sm"
            disabled={deleteMutation.isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="h-10 rounded-[8px] px-4 text-sm"
            disabled={deleteMutation.isPending}
            onClick={handleConfirm}
            type="button"
            variant="destructive"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
