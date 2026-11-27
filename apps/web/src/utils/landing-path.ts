import type { Route } from "next";

import { createTRPCServerCaller } from "@/utils/trpc-server";

// Where a signed-in user should land: staff and above go to the admin area,
// parents to their student's page. `?t=1` shows the welcome toast once.
// Returns null when there is no session, or the session matches neither.
// Runs during the server render, so the browser gets a redirect straight
// away instead of loading a page that then asks the API where to go.
export async function getLandingPath(): Promise<Route | null> {
  const trpc = await createTRPCServerCaller();
  const result = await trpc.auth.resolveLogin();

  if (!result.user) {
    return null;
  }
  if (result.isAdmin) {
    return "/admin/all-students?t=1";
  }
  const studentId = result.student[0]?.id;
  if (studentId !== undefined) {
    return `/student/${studentId}?t=1` as Route;
  }
  return null;
}
