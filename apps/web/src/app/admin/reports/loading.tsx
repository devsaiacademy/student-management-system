import {
  Card,
  CardContent,
  CardHeader,
} from "@student-management-system/ui/components/card";
import { Skeleton } from "@student-management-system/ui/components/skeleton";

function ReportsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <Skeleton className="h-8 w-20 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[340px] w-full rounded sm:h-[440px] md:h-[500px]" />
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Skeleton className="h-5 w-24 rounded md:h-6" />
      <div className="flex flex-col gap-4 md:gap-6">
        <ReportsCardSkeleton />
        <ReportsCardSkeleton />
      </div>
    </div>
  );
}
