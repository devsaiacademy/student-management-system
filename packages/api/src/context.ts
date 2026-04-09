import type { SupabaseClient } from "@supabase/supabase-js";

export type Context = {
  supabase: SupabaseClient;
  user: { id: string; email: string } | null;
};
