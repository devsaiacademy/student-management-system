import { env } from "@student-management-system/env/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-side admin operations: creating/deleting
// auth users, etc. Bypasses RLS — caller code is responsible for gating these
// operations via the appropriate tRPC procedure middleware. Never expose this
// client to the browser.
let cached: SupabaseClient | undefined;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cached) {
    return cached;
  }
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return cached;
}
