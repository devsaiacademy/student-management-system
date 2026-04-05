import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { publicProcedure, router } from "../index";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authRouter = router({
  sendMagicLink: publicProcedure
    .input(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
      })
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

      return {
        success: true as const,
      };
    }),
});
