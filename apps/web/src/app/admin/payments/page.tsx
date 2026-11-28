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
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
      <h1 className="text-center text-lg font-medium text-foreground">
        Payments
      </h1>
      <PaymentCharts data={data} />
    </div>
  );
}
