import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trpc = await createTRPCServerCaller();
  const user = await trpc.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = await trpc.auth.isAdmin();
  if (!isAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar user={user} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
