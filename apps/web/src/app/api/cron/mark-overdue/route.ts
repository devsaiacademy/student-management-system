import { markOverduePaymentsAndNotify } from "@student-management-system/api/lib/overdue-payments";
import { env } from "@student-management-system/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const result = await markOverduePaymentsAndNotify();
  return Response.json(result);
}
