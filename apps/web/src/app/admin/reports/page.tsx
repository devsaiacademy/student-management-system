import { ReportsCharts } from "@/components/admin/reports-charts";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function ReportsPage() {
  const trpc = await createTRPCServerCaller();
  const levels = await trpc.reports.getLevelsCount();

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6">
      <h1 className="text-lg font-semibold">Reports</h1>
      <ReportsCharts levels={levels} />
    </div>
  );
}
