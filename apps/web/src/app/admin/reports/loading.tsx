import { Skeleton } from "@student-management-system/ui/components/skeleton";

import { ChartCardSkeleton } from "@/components/admin/charts/chart-card-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
      <Skeleton className="mx-auto h-6 w-24 rounded" />
      <div className="flex flex-col gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}
