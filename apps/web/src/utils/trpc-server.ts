import { loadUserProfile } from "@student-management-system/api/context";
import { appRouter } from "@student-management-system/api/routers/index";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const createTRPCServerCaller = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userProfile = user ? await loadUserProfile(user.id) : null;

  return appRouter.createCaller({
    supabase,
    user: user ? { id: user.id, email: user.email ?? "" } : null,
    userProfile,
  });
});
