import { db } from "@student-management-system/db";
import type { UserRole } from "@student-management-system/db/schema/constants";
import { students } from "@student-management-system/db/schema/students";
import { userProfiles } from "@student-management-system/db/schema/user-profiles";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Staff and above land on /admin; parent (and anyone with no profile) lands
// on the parent-facing surface. Matches the staffProcedure gate so the
// pre-routing check stays consistent with what the router will allow.
function hasAdminAreaAccess(role: UserRole | undefined): boolean {
  return role === "staff" || role === "admin" || role === "super_admin";
}

export const authRouter = router({
  sendSignInEmail: publicProcedure
    .input(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.auth.signInWithOtp({
        email: input.email,
        options: { emailRedirectTo: input.redirectTo },
      });

      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }

      return { success: true };
    }),

  isStudentEmail: publicProcedure
    .input(z.object({ email: z.email() }))
    .query(async ({ input }) => {
      const student = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.email, input.email));
      return student;
    }),

  // Used by the login form's "teacher" branch to gate magic-link sends.
  // Replaces the old email-shape check; the only criterion is now whether a
  // user_profiles row exists with a staff-or-above role.
  isStaffEmail: publicProcedure
    .input(z.object({ email: z.email() }))
    .query(async ({ input }) => {
      const row = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.email, input.email),
        columns: { role: true },
      });
      return Boolean(row && hasAdminAreaAccess(row.role));
    }),

  // True when the caller's user_profile grants admin-area access (staff or
  // above). Used by /admin layouts to gate pre-render redirects.
  isAdmin: protectedProcedure.query(({ ctx }) => {
    return hasAdminAreaAccess(ctx.userProfile?.role);
  }),

  isAdminUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, ctx.user.id),
    });

    return !!user;
  }),

  getUser: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  // Public so callers can check "is anyone logged in?" without tripping
  // the UNAUTHORIZED throw from `protectedProcedure`. Returns the user
  // object when authenticated, or null when there's no session.
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  // One-shot login resolver for /welcome: collapses getUser + isAdmin +
  // isStudentEmail into a single round-trip. Public so the unauth branch
  // can redirect to /login without an UNAUTHORIZED throw.
  resolveLogin: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { user: null, isAdmin: false, student: [] };
    }
    const student = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.email, ctx.user.email));
    return {
      user: ctx.user,
      isAdmin: hasAdminAreaAccess(ctx.userProfile?.role),
      student,
    };
  }),

  // Public because a stale/expired session should still be able to log out
  // without first needing to prove it's valid.
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut();
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
    return { success: true };
  }),
});
