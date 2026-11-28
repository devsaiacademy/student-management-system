import { logger } from "@student-management-system/api/lib/logger";
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
  } catch (error) {
    // tRPC UNAUTHORIZED or transient failure → treat as signed out
    logger.warn("student layout: session lookup failed", { error });
  }

  if (!user || !isStudent) {
    logger.info("student layout: redirecting to login", {
      hasUser: Boolean(user),
      isStudent,
    });
    redirect("/login?role=parent");
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden bg-background">
      <StudentSidebar user={user} />
      <SidebarInset>
        <SidebarTrigger className="absolute right-2 top-2 size-10 rounded-md border border-border bg-background shadow-sm [&_svg]:size-5 md:right-auto md:top-auto md:size-8 md:rounded-none md:border-0 md:bg-transparent md:shadow-none md:[&_svg]:size-4" />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
