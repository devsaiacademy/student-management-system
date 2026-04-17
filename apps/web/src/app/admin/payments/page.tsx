import { PaymentCharts } from "@/components/admin/payment-charts";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function PaymentsPage() {
  const trpc = await createTRPCServerCaller();
  const data = await trpc.payments.getPaymentOverview();

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <h1 className="text-base font-semibold md:text-lg">Payments</h1>
      <PaymentCharts data={data} />
    </div>
  );
}
