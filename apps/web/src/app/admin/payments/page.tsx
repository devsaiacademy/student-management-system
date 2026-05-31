import { unstable_noStore as noStore } from "next/cache";

import { PaymentCharts } from "@/components/admin/payment-charts";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function PaymentsPage() {
  // Opt this fetch out of the Data Cache — partial chunks land via webhook
  // outside the request lifecycle, so a cached server render would show
  // stale totals. Narrower than `dynamic = "force-dynamic"` because only
  // this query needs freshness, not every render path.
  // TODO(payments): swap for webhook-triggered revalidation
  // (`revalidateTag("payments-overview")` from syncOrderPaymentState) so the
  // admin page can serve a cached payload between chunk events.
  noStore();
  const trpc = await createTRPCServerCaller();
  const data = await trpc.payments.getPaymentOverview();

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <h1 className="text-base font-semibold md:text-lg">Payments</h1>
      <PaymentCharts data={data} />
    </div>
  );
}
