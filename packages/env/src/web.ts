import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Next.js loads `.env` automatically for NEXT_PUBLIC_* variables and inlines
// them at build time, so no dotenv / Node filesystem imports are needed here.
// Keeping this file free of `node:*` imports is what makes it safe to import
// from client components (e.g. pay-button.tsx).
export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  emptyStringAsUndefined: true,
});
