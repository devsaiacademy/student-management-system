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

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

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
        notify.success("Course removed");
        onSuccess();
      },
      onError: (err) => {
        notify.error(err.message);
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
