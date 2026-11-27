import { redirect } from "next/navigation";

import { getLandingPath } from "@/utils/landing-path";

// Magic-link and OAuth sign-ins land here from /auth/callback.
export default async function WelcomePage() {
  const landingPath = await getLandingPath();
  redirect(landingPath ?? "/login?role=parent");
}
