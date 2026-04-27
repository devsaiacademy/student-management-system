import { Skeleton } from "@student-management-system/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-3 py-8">
      <div className="flex w-full max-w-md flex-col items-center justify-center">
        <Skeleton className="mb-6 h-10 w-40 rounded" />
        <div className="flex w-full flex-col gap-5">
          <Skeleton className="h-9 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
          <div className="mt-3 flex flex-col gap-3">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="mt-2 h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="mx-auto mt-3 h-4 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}
