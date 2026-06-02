"use client";

import type { UserRole } from "@student-management-system/db/schema/constants";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { useMutation } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useEffect, useState } from "react";

import { trpc } from "@/utils/trpc";

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  staff: "Staff",
  parent: "Parent",
};

const TOAST_OPTS = {
  showTimestamp: false,
  borderColor: "#E0E0E0",
  borderWidth: 1.5,
  timing: { displayDuration: 4000 },
} as const;

type AssignableRole = Extract<UserRole, "admin" | "staff">;

type CreateValues = { mode: "create" };

type EditValues = {
  mode: "edit";
  initialValues?: { id: string; name: string; role: AssignableRole };
};

type UserFormDialogProps = (CreateValues | EditValues) & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  roleOptions: AssignableRole[];
};

export function UserFormDialog(props: UserFormDialogProps) {
  const { onOpenChange, onSuccess, open, roleOptions } = props;
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initialValues : undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole | "">(initial?.role ?? "");

  // Reset whenever the dialog re-opens with a different target.
  useEffect(() => {
    if (!open) {
      return;
    }
    setName(initial?.name ?? "");
    setEmail("");
    setRole(initial?.role ?? "");
  }, [open, initial?.name, initial?.role]);

  const createMutation = useMutation(
    trpc.users.create.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("User added", {
          ...TOAST_OPTS,
          description: "They can sign in via magic link from /login.",
        });
        onSuccess();
      },
      onError: (err) => {
        gooeyToast.error("Failed to add user", {
          ...TOAST_OPTS,
          description: err.message,
        });
      },
    })
  );

  const updateMutation = useMutation(
    trpc.users.update.mutationOptions({
      onSuccess: () => {
        gooeyToast.success("User updated", { ...TOAST_OPTS });
        onSuccess();
      },
      onError: (err) => {
        gooeyToast.error("Failed to update user", {
          ...TOAST_OPTS,
          description: err.message,
        });
      },
    })
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) {
      gooeyToast.error("Pick a role", { ...TOAST_OPTS });
      return;
    }
    if (isEdit) {
      if (!initial) {
        return;
      }
      updateMutation.mutate({ id: initial.id, name: name.trim(), role });
    } else {
      createMutation.mutate({ email: email.trim(), name: name.trim(), role });
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user's display name and role."
              : "The user can sign in immediately via magic link from /login. No invitation email is sent."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              autoComplete="off"
              className="h-10 rounded-[8px] px-3 text-sm"
              id="user-name"
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                autoComplete="off"
                className="h-10 rounded-[8px] px-3 text-sm"
                id="user-email"
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Role</Label>
            <Select
              onValueChange={(value) => setRole(value as AssignableRole)}
              value={role}
            >
              <SelectTrigger
                className="h-10 rounded-[8px] px-3 text-sm"
                id="user-role"
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="rounded-[8px]">
                {roleOptions.map((r) => (
                  <SelectItem
                    className="rounded-[6px] text-sm"
                    key={r}
                    value={r}
                  >
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
