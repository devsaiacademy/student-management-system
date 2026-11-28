"use client";

import {
  USER_ROLES,
  type UserRole,
} from "@student-management-system/db/schema/constants";
import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Button } from "@student-management-system/ui/components/button";
import { Input } from "@student-management-system/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

import { DeleteUserDialog } from "./delete-user-dialog";
import { UserFormDialog } from "./user-form-dialog";

type WorkerRole = Extract<UserRole, "super_admin" | "admin" | "staff">;
type AssignableRole = Extract<UserRole, "admin" | "staff">;

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

type UsersManagerProps = {
  callerId: string;
  callerRole: WorkerRole;
  initialUsers: UserRow[];
};

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  staff: "Staff",
  parent: "Parent",
};

// Only worker roles are managed here. Parents are end-customers,
// auto-provisioned by the parent-login trigger, and live on their own
// route.
function assignableRoles(callerRole: WorkerRole): AssignableRole[] {
  if (callerRole === "super_admin") {
    return ["admin", "staff"];
  }
  return ["staff"];
}

function handleFor(email: string): string {
  const local = email.split("@")[0] ?? email;
  // Strip plus-aliases and anything beyond the canonical handle so
  // "anita+kid1@foo.com" reads as @anita.
  return `@${local.split("+")[0] ?? local}`;
}

function initialFor(name: string, email: string): string {
  const source = name.trim() || email;
  return source.charAt(0).toUpperCase();
}

export function UsersManager({
  callerId,
  callerRole,
  initialUsers,
}: UsersManagerProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole | "">("");

  const usersQuery = useQuery({
    ...trpc.users.list.queryOptions(),
    initialData: initialUsers,
  });
  const users: UserRow[] = useMemo(() => {
    const data = usersQuery.data ?? initialUsers;
    // Pin the caller's row to the top so they can always find themselves
    // without scrolling. Preserves the createdAt desc order for the rest.
    return [...data].sort((a, b) => {
      if (a.id === callerId) return -1;
      if (b.id === callerId) return 1;
      return 0;
    });
  }, [usersQuery.data, initialUsers, callerId]);

  const roleOptions = useMemo(() => assignableRoles(callerRole), [callerRole]);

  const invalidateList = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.users.list.queryOptions().queryKey,
    });
  };

  const createMutation = useMutation(
    trpc.users.create.mutationOptions({
      onSuccess: () => {
        notify.success("They can sign in via magic link from /login");
        setName("");
        setEmail("");
        setRole("");
        invalidateList();
      },
      onError: (err) => {
        notify.error(err.message);
      },
    })
  );

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) {
      notify.error("Pick a role");
      return;
    }
    createMutation.mutate({
      email: email.trim(),
      name: name.trim(),
      role,
    });
  }

  const adding = createMutation.isPending;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex justify-center">
        <h1 className="text-lg font-medium text-foreground">Teachers</h1>
      </header>

      <form
        aria-label="Add user"
        className="flex flex-wrap items-center gap-3"
        onSubmit={handleAdd}
      >
        <Input
          aria-label="Name"
          autoComplete="off"
          className="h-10 min-w-[160px] flex-1 rounded-[8px] border-input bg-white px-3 text-sm shadow-sm"
          disabled={adding}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          value={name}
        />
        <Input
          aria-label="Email"
          autoComplete="off"
          className="h-10 min-w-[200px] flex-1 rounded-[8px] border-input bg-white px-3 text-sm shadow-sm"
          disabled={adding}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />
        <Select
          disabled={adding}
          onValueChange={(value) => setRole(value as AssignableRole)}
          value={role}
        >
          <SelectTrigger
            aria-label="Role"
            className="data-[size=default]:h-10 w-[140px] rounded-[8px] border-input bg-white px-3 text-sm shadow-sm"
          >
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="rounded-[8px]">
            {roleOptions.map((r) => (
              <SelectItem className="rounded-[6px] text-sm" key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="h-10 min-w-[88px] rounded-[8px] px-4 text-sm"
          disabled={adding}
          type="submit"
        >
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>

      <ul className="divide-y divide-border overflow-hidden rounded-[12px] bg-card shadow-sm ring-1 ring-foreground/10 transition-shadow duration-200 hover:shadow-md">
        {users.length === 0 ? (
          <li className="py-12 text-center text-sm text-muted-foreground">
            No users yet. Fill the form above and click{" "}
            <strong className="font-medium">Add</strong> to invite the first
            one.
          </li>
        ) : (
          users.map((user) => {
            const isSelf = user.id === callerId;
            const isSuperAdmin = user.role === "super_admin";
            const lockEdit = isSuperAdmin;
            const lockDelete = isSelf || isSuperAdmin;
            return (
              <li
                aria-current={isSelf ? "true" : undefined}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:gap-6"
                key={user.id}
              >
                <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {initialFor(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                      {isSelf ? (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-normal text-primary">
                          You
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {handleFor(user.email)}
                    </span>
                  </div>
                </div>

                <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                  {ROLE_LABEL[user.role]}
                </span>

                <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>

                <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 sm:col-start-auto sm:row-start-auto sm:gap-2">
                  <button
                    aria-label={`Delete ${user.name}`}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={lockDelete}
                    onClick={() => setDeleting(user)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                  <button
                    aria-label={`Edit ${user.name}`}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={lockEdit}
                    onClick={() => setEditing(user)}
                    type="button"
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <UserFormDialog
        initialValues={
          editing && (editing.role === "admin" || editing.role === "staff")
            ? { id: editing.id, name: editing.name, role: editing.role }
            : undefined
        }
        mode="edit"
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        onSuccess={() => {
          setEditing(null);
          invalidateList();
        }}
        open={editing !== null}
        roleOptions={roleOptions}
      />

      <DeleteUserDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onSuccess={() => {
          setDeleting(null);
          invalidateList();
        }}
        open={deleting !== null}
        user={deleting}
      />
    </div>
  );
}

export { USER_ROLES };
