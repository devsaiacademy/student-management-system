import { redirect } from "next/navigation";

import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function WelcomePage() {
  const trpc = await createTRPCServerCaller();
  const user = await trpc.auth.getUser();

  if (!user) {
    redirect("/login?role=parent");
  }

  const isAdmin = await trpc.auth.isAdmin();

  if (isAdmin) {
    redirect("/admin/all-students?t=1" as any);
  }

  const student = await trpc.auth.isStudentEmail({ email: user.email });

  if (student && student.length > 0) {
    redirect(`/student/${student[0]?.id}?t=1` as any);
  }
}
