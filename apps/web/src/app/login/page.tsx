import { redirect } from "next/navigation";
import { Suspense } from "react";

import Login from "@/components/login";
import { getLandingPath } from "@/utils/landing-path";

export default async function LoginPage() {
  // Already signed in: send the user straight to their area. A session with
  // no admin role and no student record falls through to the login form.
  const landingPath = await getLandingPath();
  if (landingPath) {
    redirect(landingPath);
  }

  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
