import { Skeleton } from "@student-management-system/ui/components/skeleton";

const SKELETON_KEYS = ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"] as const;

export default function UsersLoading() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 min-w-[160px] flex-1 rounded-[8px]" />
        <Skeleton className="h-10 min-w-[200px] flex-1 rounded-[8px]" />
        <Skeleton className="h-10 w-[140px] rounded-[8px]" />
        <Skeleton className="h-10 w-[88px] rounded-[8px]" />
      </div>

      <ul className="divide-y divide-border">
        {SKELETON_KEYS.map((key) => (
          <li
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:gap-6"
            key={key}
          >
            <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="hidden h-4 w-48 sm:block" />
            <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 sm:col-start-auto sm:row-start-auto sm:gap-2">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
