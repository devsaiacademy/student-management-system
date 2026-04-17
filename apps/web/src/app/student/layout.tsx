import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@student-management-system/ui/components/sidebar";
import { redirect } from "next/navigation";

import { StudentSidebar } from "@/components/student/student-sidebar";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trpc = await createTRPCServerCaller();

  let user: Awaited<ReturnType<typeof trpc.auth.getUser>> | null = null;
  let isStudent = false;
  try {
    user = await trpc.auth.getUser();
    if (user?.email) {
      const match = await trpc.auth.isStudentEmail({ email: user.email });
      isStudent = Array.isArray(match) ? match.length > 0 : Boolean(match);
    }
  } catch {
    // tRPC UNAUTHORIZED or transient failure → treat as signed out
  }

  if (!user || !isStudent) {
    redirect("/login");
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden bg-background">
      <StudentSidebar user={user} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:h-14">
          <SidebarTrigger />
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
