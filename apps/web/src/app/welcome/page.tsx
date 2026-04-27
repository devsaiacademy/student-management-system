import { redirect } from "next/navigation";

import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function WelcomePage() {
  const trpc = await createTRPCServerCaller();
  const { user, isAdmin, student } = await trpc.auth.resolveLogin();

  if (!user) {
    redirect("/login?role=parent");
  }

  if (isAdmin) {
    redirect("/admin/all-students?t=1" as any);
  }

  if (student.length > 0) {
    redirect(`/student/${student[0]?.id}?t=1` as any);
  }
}
