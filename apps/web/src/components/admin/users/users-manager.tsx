"use client";

import {
  USER_ROLES,
  type UserRole,
} from "@student-management-system/db/schema/constants";
import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Badge } from "@student-management-system/ui/components/badge";
import { Button } from "@student-management-system/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

import { DeleteUserDialog } from "./delete-user-dialog";
import { UserFormDialog } from "./user-form-dialog";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

type UsersManagerProps = {
  callerId: string;
  callerRole: UserRole;
  initialUsers: UserRow[];
};

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  staff: "Staff",
  parent: "Parent",
};

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  super_admin: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-sky-50 text-sky-700 border-sky-200",
  parent: "bg-muted text-muted-foreground border-border",
};

function assignableRoles(callerRole: UserRole): UserRole[] {
  if (callerRole === "super_admin") {
    return ["admin", "staff", "parent"];
  }
  return ["staff", "parent"];
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
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  const usersQuery = useQuery({
    ...trpc.users.list.queryOptions(),
    initialData: initialUsers,
  });
  const users: UserRow[] = usersQuery.data ?? initialUsers;

  const roleOptions = useMemo(() => assignableRoles(callerRole), [callerRole]);

  const invalidateList = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.users.list.queryOptions().queryKey,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            Admins, staff, and parents who can sign in to the platform.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} type="button">
          <Plus className="size-4" aria-hidden />
          Add user
        </Button>
      </header>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1.4fr_0.8fr_140px] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-border">
          {users.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">
              No users yet. Click <strong>Add user</strong> to invite the first
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
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 md:grid-cols-[1.4fr_1.4fr_0.8fr_140px] md:gap-4 md:px-5"
                  key={user.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initialFor(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground md:hidden">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <span className="hidden truncate text-sm text-muted-foreground md:inline">
                    {user.email}
                  </span>

                  <div className="hidden md:block">
                    <Badge
                      className={ROLE_BADGE_CLASS[user.role]}
                      variant="outline"
                    >
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <Button
                      aria-label={`Edit ${user.name}`}
                      disabled={lockEdit}
                      onClick={() => setEditing(user)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Edit
                    </Button>
                    <Button
                      aria-label={`Delete ${user.name}`}
                      disabled={lockDelete}
                      onClick={() => setDeleting(user)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <UserFormDialog
        mode="create"
        onOpenChange={setAddOpen}
        onSuccess={() => {
          setAddOpen(false);
          invalidateList();
        }}
        open={addOpen}
        roleOptions={roleOptions}
      />

      <UserFormDialog
        initialValues={
          editing
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
