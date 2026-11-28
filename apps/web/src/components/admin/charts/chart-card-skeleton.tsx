import {
  Card,
  CardContent,
  CardHeader,
} from "@student-management-system/ui/components/card";
import { Skeleton } from "@student-management-system/ui/components/skeleton";

type ChartCardSkeletonProps = {
  withToggle?: boolean;
};

export function ChartCardSkeleton({
  withToggle = true,
}: ChartCardSkeletonProps = {}) {
  return (
    <Card className="rounded-[12px] shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        {withToggle ? <Skeleton className="h-8 w-20 rounded" /> : null}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[340px] w-full rounded sm:h-[440px] md:h-[500px]" />
      </CardContent>
    </Card>
  );
}
