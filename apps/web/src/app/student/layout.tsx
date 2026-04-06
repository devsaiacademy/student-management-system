import { redirect } from "next/navigation";

import { StudentSidebar } from "@/components/student/student-sidebar";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trpc = await createTRPCServerCaller();
  const user = await trpc.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const isStudent = await trpc.auth.isStudentEmail({ email: user.email });
  if (!isStudent) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <StudentSidebar user={user} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
