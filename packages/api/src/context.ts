import { db } from "@student-management-system/db";
import type { UserRole } from "@student-management-system/db/schema/constants";
import { userProfiles } from "@student-management-system/db/schema/user-profiles";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type Context = {
  supabase: SupabaseClient;
  user: { id: string; email: string } | null;
  // Loaded once per request when a session exists. Procedures gate
  // authorization on `userProfile.role`; `null` means no row in
  // public.user_profiles for this auth.uid() — treat as not provisioned.
  userProfile: UserProfile | null;
};

export async function loadUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, userId),
    columns: { id: true, email: true, name: true, role: true },
  });
  return profile ?? null;
}
