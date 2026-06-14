import {
  Card,
  CardContent,
  CardHeader,
} from "@student-management-system/ui/components/card";
import { Skeleton } from "@student-management-system/ui/components/skeleton";

// Stable keys for the static placeholder rows (avoids array-index keys).
const ROW_KEYS = Array.from({ length: 12 }, (_, index) => `row-${index}`);

// Mirrors the AddStudentForm layout (heading + two stacked cards, each a
// two-column grid of labelled rows) so the edit route doesn't flash empty
// while the student data is fetched.
function CardSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="rounded-[12px]">
      <CardHeader className="border-b">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {ROW_KEYS.slice(0, rows).map((key) => (
            <div
              className="grid grid-cols-[140px_1fr] items-center gap-x-3"
              key={key}
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 max-w-[300px] rounded-[8px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditStudentLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6">
      <Skeleton className="mx-auto h-6 w-64" />
      <CardSkeleton rows={12} />
      <CardSkeleton rows={10} />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-[8px]" />
      </div>
    </div>
  );
}
