import { logger } from "@student-management-system/api/lib/logger";
import { handleRazorpayWebhook } from "@student-management-system/api/lib/razorpay-webhook";
import { env } from "@student-management-system/env/server";

export async function POST(req: Request) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Endpoint exists but isn't configured yet — surfaces as a delivery error
    // in the Razorpay dashboard so misconfiguration is visible.
    logger.error("razorpay webhook: RAZORPAY_WEBHOOK_SECRET is not set");
    return new Response("webhook secret not configured", { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const result = await handleRazorpayWebhook(raw, signature, secret);

  switch (result.kind) {
    case "invalid_signature":
      return new Response("invalid signature", { status: 400 });
    case "invalid_body":
      return new Response("invalid json", { status: 400 });
    default:
      return Response.json({ ok: true, processed: result.processed });
  }
}
