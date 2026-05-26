import { Skeleton } from "@student-management-system/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Skeleton className="h-5 w-24 rounded md:h-6" />
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-72 rounded" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}
