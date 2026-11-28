import { ReportsCharts } from "@/components/admin/reports-charts";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function ReportsPage() {
  const trpc = await createTRPCServerCaller();
  const [levels, sources] = await Promise.all([
    trpc.reports.getLevelsCount(),
    trpc.reports.getSourcesCount(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
      <h1 className="text-center text-lg font-medium text-foreground">
        Reports
      </h1>
      <ReportsCharts levels={levels} sources={sources} />
    </div>
  );
}
