import { Skeleton } from "@student-management-system/ui/components/skeleton";

const SKELETON_KEYS = ["c1", "c2", "c3", "c4", "c5", "c6"] as const;

export default function Loading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-5 md:px-12">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 md:px-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.map((key) => (
            <div
              className="flex flex-col gap-3 rounded-[12px] bg-background p-5 shadow-sm"
              key={key}
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="flex gap-1">
                  <Skeleton className="size-7 rounded-md" />
                  <Skeleton className="size-7 rounded-md" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
