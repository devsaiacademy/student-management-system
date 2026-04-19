import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { userProfiles } from "@student-management-system/db/schema/user-profiles";
import { env } from "@student-management-system/env/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { MagicLinkEmail } from "../emails/magic-link-email";
import { protectedProcedure, publicProcedure, router } from "../index";
import { isOtomatiksAdminEmail } from "../lib/admin-email";
import { resend } from "../lib/resend";
import { supabaseAdmin } from "../lib/supabase-admin";

export const authRouter = router({
  sendMagicLink: publicProcedure
    .input(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Dev: keep Supabase's built-in flow so Mailpit delivery still works.
      if (env.NODE_ENV !== "production") {
        console.log(env.NODE_ENV);

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
      }

      // Prod: mint the link via Supabase admin, deliver it via Resend.
      if (!(supabaseAdmin && resend)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Email service not configured",
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: input.email,
        options: { redirectTo: input.redirectTo },
      });

      const hashedToken = data?.properties?.hashed_token;
      if (error || !hashedToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message ?? "Failed to generate magic link",
        });
      }

      const actionUrl = new URL(input.redirectTo);
      actionUrl.searchParams.set("token_hash", hashedToken);
      actionUrl.searchParams.set("type", "email");
      const actionLink = actionUrl.toString();

      const { error: sendError } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: input.email,
        subject: "Your Otomatiks sign-in link",
        react: MagicLinkEmail({ actionLink }),
      });

      if (sendError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: sendError.message,
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

  // using this before logging in.
  isAdmin: protectedProcedure.query(({ ctx }) => {
    return isOtomatiksAdminEmail(ctx.user.email);
  }),

  isAdminUser: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.user.id;

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, email),
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
