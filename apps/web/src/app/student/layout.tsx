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
    <div className="flex h-screen overflow-hidden bg-background">
      <StudentSidebar user={user} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
