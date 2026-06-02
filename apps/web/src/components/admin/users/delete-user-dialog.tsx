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

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: { id: string; name: string; email: string } | null;
};

export function DeleteUserDialog({
  onOpenChange,
  onSuccess,
  open,
  user,
}: DeleteUserDialogProps) {
  const deleteMutation = useMutation(
    trpc.users.delete.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("User removed", { ...TOAST_OPTS });
        onSuccess();
      },
      onError: (err) => {
        gooeyToast.error("Failed to delete user", {
          ...TOAST_OPTS,
          description: err.message,
        });
      },
    })
  );

  function handleConfirm() {
    if (!user) {
      return;
    }
    deleteMutation.mutate({ id: user.id });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            {user
              ? `Permanently remove ${user.name} (${user.email}). They will no longer be able to sign in. This cannot be undone.`
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
