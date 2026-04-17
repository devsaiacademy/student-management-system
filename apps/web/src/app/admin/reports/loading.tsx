import {
  Card,
  CardContent,
  CardHeader,
} from "@student-management-system/ui/components/card";
import { Skeleton } from "@student-management-system/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Skeleton className="h-5 w-24 rounded md:h-6" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded sm:h-[360px] md:h-[400px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded sm:h-[360px] md:h-[400px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
