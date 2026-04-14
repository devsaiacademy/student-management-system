import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trpc = await createTRPCServerCaller();

  let user: Awaited<ReturnType<typeof trpc.auth.getUser>> | null = null;
  let isAdmin = false;
  try {
    user = await trpc.auth.getUser();
    isAdmin = await trpc.auth.isAdmin();
  } catch {
    // tRPC UNAUTHORIZED or transient failure → treat as signed out
  }

  if (!user || !isAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar user={user} />
      <main className="flex flex-1 flex-col overflow-scroll">{children}</main>
    </div>
  );
}
