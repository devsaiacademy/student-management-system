import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { eq } from "drizzle-orm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const authRouter = router({
  sendMagicLink: publicProcedure
    .input(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
      }),
    )
    .mutation(async ({ input }) => {
      const { error } = await supabase.auth.signInWithOtp({
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
    .input(z.object({
      email: z.email(),
    }))
    .query(async ({ input }) => {
      const user = await db.select().from(students).where(eq(students.email, input.email));
      console.log(user);
      if (user.length > 0) {
        return true;
      }

      return false;
    }),
});
