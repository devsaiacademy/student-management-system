import { Skeleton } from "@student-management-system/ui/components/skeleton";

import { ChartCardSkeleton } from "@/components/admin/charts/chart-card-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Skeleton className="h-5 w-24 rounded md:h-6" />
      <div className="flex flex-col gap-4 md:gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}
