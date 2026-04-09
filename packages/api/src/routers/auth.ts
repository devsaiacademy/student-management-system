import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { isOtomatiksAdminEmail } from "../lib/admin-email";
import { protectedProcedure, publicProcedure, router } from "../index";

export const authRouter = router({
  sendMagicLink: publicProcedure
    .input(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.auth.signInWithOtp({
        email: input.email,
        options: {
          emailRedirectTo: input.redirectTo,
        },
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

  isAdmin: protectedProcedure.query(({ ctx }) => {
    return isOtomatiksAdminEmail(ctx.user.email);
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
