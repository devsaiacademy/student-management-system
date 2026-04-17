import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { Skeleton } from "@student-management-system/ui/components/skeleton";

const CARD_BG =
  "rounded-xl bg-surface-info text-surface-info-foreground p-5 sm:p-6 md:p-8";
const PAYMENT_ROW_COUNT = 5;

function FieldSkeleton({ big }: { big?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className={big ? "h-6 w-32 rounded" : "h-4 w-24 rounded"} />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-start justify-between gap-8 px-4 pt-6 pb-4 sm:px-6 md:px-10 md:pt-8 md:pb-6">
        <div className="flex items-center gap-5">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-36 max-w-full rounded" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <Skeleton className="h-3.5 w-40 max-w-full rounded" />
              <Skeleton className="h-3.5 w-28 max-w-full rounded" />
              <Skeleton className="h-3.5 w-24 max-w-full rounded" />
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-10 pb-10 max-md:px-4">
          <div className="border-b border-border">
            <span className="inline-block border-b-2 border-primary px-1 pb-2 text-[13px] font-medium text-primary">
              Overview
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className={CARD_BG}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-7">
                <FieldSkeleton big />
                <FieldSkeleton big />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
            </div>
            <div className={CARD_BG}>
              <div className="flex h-full flex-col justify-center gap-3">
                <Skeleton className="h-3 w-32 max-w-full rounded" />
                <Skeleton className="h-8 w-40 max-w-full rounded" />
                <Skeleton className="h-3 w-56 max-w-full rounded" />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_0.7fr_0.7fr_0.9fr] gap-4 border-b border-border py-4 md:grid">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
              <span />
            </div>
            {Array.from({ length: PAYMENT_ROW_COUNT }).map((_, index) => (
              <div
                className="hidden grid-cols-[1.1fr_1fr_1fr_0.7fr_0.7fr_0.9fr] items-center gap-4 border-b border-border py-5 md:grid"
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                key={`desktop-${index}`}
              >
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            ))}
            {Array.from({ length: PAYMENT_ROW_COUNT }).map((_, index) => (
              <div
                className="flex flex-col gap-2 border-b border-border py-4 md:hidden"
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                key={`mobile-${index}`}
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
