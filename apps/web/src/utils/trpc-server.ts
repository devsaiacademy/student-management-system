import {
  getSessionUser,
  loadUserProfile,
} from "@student-management-system/api/context";
import { appRouter } from "@student-management-system/api/routers/index";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const createTRPCServerCaller = cache(async () => {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  const userProfile = user ? await loadUserProfile(user.id) : null;

  return appRouter.createCaller({ supabase, user, userProfile });
});
