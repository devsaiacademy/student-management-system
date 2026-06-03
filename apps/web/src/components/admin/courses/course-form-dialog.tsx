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
import { Input } from "@student-management-system/ui/components/input";
import { Label } from "@student-management-system/ui/components/label";
import { Textarea } from "@student-management-system/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

type CreateProps = { mode: "create" };
type EditProps = {
  mode: "edit";
  initialValues: { id: number; name: string; description: string };
};

type CourseFormDialogProps = (CreateProps | EditProps) & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function CourseFormDialog(props: CourseFormDialogProps) {
  const { onOpenChange, onSuccess, open } = props;
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initialValues : undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
  }, [open, initial?.name, initial?.description]);

  const createMutation = useMutation(
    trpc.courses.create.mutationOptions({
      onSuccess: () => {
        notify.success("Course added");
        onSuccess();
      },
      onError: (err) => {
        notify.error(err.message);
      },
    })
  );

  const updateMutation = useMutation(
    trpc.courses.update.mutationOptions({
      onSuccess: () => {
        notify.success("Course updated");
        onSuccess();
      },
      onError: (err) => {
        notify.error(err.message);
      },
    })
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) {
      notify.error("Name and description are required");
      return;
    }
    if (isEdit && initial) {
      updateMutation.mutate({
        id: initial.id,
        name: trimmedName,
        description: trimmedDescription,
      });
    } else {
      createMutation.mutate({
        name: trimmedName,
        description: trimmedDescription,
      });
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "Add course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the course name and description."
              : "New courses immediately appear in the Add Student form."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-name">Name</Label>
            <Input
              autoComplete="off"
              className="h-10 rounded-[8px] px-3 text-sm"
              id="course-name"
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Robotics"
              required
              value={name}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-description">Description</Label>
            <Textarea
              className="min-h-[120px] rounded-[8px] px-3 py-2 text-sm"
              id="course-description"
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this course covers, who it's for, etc."
              required
              value={description}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              className="h-10 rounded-[8px] px-4 text-sm"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="h-10 rounded-[8px] px-4 text-sm"
              disabled={pending}
              type="submit"
            >
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
