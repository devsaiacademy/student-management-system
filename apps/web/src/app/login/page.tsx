import { Suspense } from "react";

import Login from "@/components/login";
import { createTRPCServerCaller } from "@/utils/trpc-server";
import { redirect } from "next/navigation";
export default async function LoginPage() {
  // const trpc=await createTRPCServerCaller()
  // const user = trpc.auth.getUser()

  // if((await user).id){
  //   redirect("/welcome")
  // }
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
