import { redirect } from "next/navigation";

import { UsersManager } from "@/components/admin/users/users-manager";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function UsersPage() {
  const trpc = await createTRPCServerCaller();
  const callerProfile = await trpc.auth.getUserProfile();

  // Only admin / super_admin may view this page. Staff are bounced even
  // though the admin layout lets them through — staff can't manage users.
  if (
    !callerProfile ||
    (callerProfile.role !== "admin" && callerProfile.role !== "super_admin")
  ) {
    redirect("/admin/all-students");
  }

  const users = await trpc.users.list();

  // tRPC over the wire would serialize Date -> string; do it here too so the
  // type matches the client component's expectation when SSR-hydrating.
  const initialUsers = users.map((user) => ({
    ...user,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
  }));

  return (
    <UsersManager
      callerId={callerProfile.id}
      callerRole={callerProfile.role}
      initialUsers={initialUsers}
    />
  );
}
