import { appRouter } from "@student-management-system/api/routers/index";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const createTRPCServerCaller = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return appRouter.createCaller({
    supabase,
    user: user ? { id: user.id, email: user.email ?? "" } : null,
  });
});
