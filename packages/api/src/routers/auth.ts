import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

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

  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user?.email?.includes("@otomatiks.in") ?? false;
  }),

  getUser: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
