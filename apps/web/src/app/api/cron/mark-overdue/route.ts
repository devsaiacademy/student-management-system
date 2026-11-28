import { logger } from "@student-management-system/api/lib/logger";
import { markOverduePaymentsAndNotify } from "@student-management-system/api/lib/overdue-payments";
import { env } from "@student-management-system/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expected) {
    logger.warn("cron mark-overdue: rejected request with bad auth header", {
      hasAuthHeader: authHeader.length > 0,
    });
    return new Response("unauthorized", { status: 401 });
  }

  const startedAt = Date.now();
  logger.info("cron mark-overdue: started");
  try {
    const result = await markOverduePaymentsAndNotify();
    logger.info("cron mark-overdue: finished", {
      durationMs: Date.now() - startedAt,
      flipped: result.flipped,
      penaltiesApplied: result.penaltiesApplied,
      emailsSent: result.emailsSent,
      whatsappsSent: result.whatsappsSent,
      failureCount: result.failures.length,
    });
    return Response.json(result);
  } catch (error) {
    logger.error("cron mark-overdue: run failed", {
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
}
