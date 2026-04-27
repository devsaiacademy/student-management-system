import { Suspense } from "react";

import Login from "@/components/login";
import { WelcomeRedirector } from "@/components/welcome-redirector";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function LoginPage() {
  const trpc = await createTRPCServerCaller();
  const session = await trpc.auth.getSession();

  if (session) {
    return <WelcomeRedirector />;
  }

  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
