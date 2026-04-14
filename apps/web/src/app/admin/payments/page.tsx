import { PaymentCharts } from "@/components/admin/payment-charts";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function PaymentsPage() {
  const trpc = await createTRPCServerCaller();
  const data = await trpc.payments.getPaymentOverview();

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6">
      <h1 className="text-lg font-semibold">Payments</h1>
      <PaymentCharts data={data} />
    </div>
  );
}
