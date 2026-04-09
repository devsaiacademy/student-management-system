import { redirect } from "next/navigation";
import { Suspense } from "react";

import Login from "@/components/login";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function LoginPage() {
  const trpc = await createTRPCServerCaller();
  const session = await trpc.auth.getSession();

  if (session) {
    redirect("/welcome");
  }

  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
