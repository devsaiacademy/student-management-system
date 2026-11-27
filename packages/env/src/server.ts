import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, "../../../.env") });

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.url().optional(),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM: z.email(),
    CRON_SECRET: z.string().min(1),
    WHATSAPP_ACCESS_TOKEN: z.string().min(1),
    WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
    WHATSAPP_OVERDUE_TEMPLATE: z.string().min(1).default("fee_due_reminder"),
    WHATSAPP_PAYMENT_RECEIVED_TEMPLATE: z
      .string()
      .min(1)
      .default("payment_received"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
