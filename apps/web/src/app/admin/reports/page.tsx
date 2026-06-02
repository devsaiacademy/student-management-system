import { ReportsCharts } from "@/components/admin/reports-charts";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function ReportsPage() {
  const trpc = await createTRPCServerCaller();
  const [levels, sources] = await Promise.all([
    trpc.reports.getLevelsCount(),
    trpc.reports.getSourcesCount(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <h1 className="text-center text-base font-semibold text-foreground md:text-lg">
        Reports
      </h1>
      <ReportsCharts levels={levels} sources={sources} />
    </div>
  );
}
