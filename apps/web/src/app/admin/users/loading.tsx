import { Skeleton } from "@student-management-system/ui/components/skeleton";

const SKELETON_KEYS = ["u1", "u2", "u3", "u4", "u5", "u6"] as const;

export default function UsersLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </header>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1.4fr_0.8fr_72px] gap-4 border-b border-border bg-muted/40 px-5 py-3 md:grid">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        <ul className="divide-y divide-border">
          {SKELETON_KEYS.map((key) => (
            <li
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 md:grid-cols-[1.4fr_1.4fr_0.8fr_72px] md:gap-4 md:px-5"
              key={key}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="hidden h-4 w-48 md:block" />
              <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-16" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
