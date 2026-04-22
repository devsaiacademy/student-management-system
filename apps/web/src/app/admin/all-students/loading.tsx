import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { Skeleton } from "@student-management-system/ui/components/skeleton";

const SKELETON_ROW_COUNT = 8;

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b border-border bg-background px-4 py-3 pl-14 md:grid md:h-[73px] md:grid-cols-3 md:items-center md:gap-4 md:px-6 md:py-4 md:pl-6">
        <div className="hidden md:block" />
        <div className="w-full md:mx-auto md:max-w-md">
          <Skeleton className="h-10 w-full rounded-[8px]" />
        </div>
        <div className="flex items-center gap-2 md:justify-end md:gap-3">
          <Skeleton className="h-10 w-full flex-1 rounded-[8px] md:w-[150px] md:flex-none" />
          <Skeleton className="h-10 w-full flex-1 rounded-[8px] md:w-[150px] md:flex-none" />
        </div>
      </header>

      <ScrollArea className="max-h-[85vh] flex-1">
        <div className="flex flex-col gap-3 px-6 py-6">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <div
              className="flex items-start gap-3 rounded-[12px] border border-border bg-[#F5F5F5] px-4 py-4 sm:items-center sm:gap-4 sm:px-5"
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              key={index}
            >
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                  </div>
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="size-4 shrink-0 self-center rounded" />
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="flex items-center bg-background px-6 py-4">
        <div className="flex-1" />
        <div className="flex justify-center">
          <Skeleton className="h-9 w-64 rounded-[8px]" />
        </div>
        <div className="flex flex-1 justify-end">
          <Skeleton className="hidden h-4 w-32 rounded sm:block" />
        </div>
      </footer>
    </div>
  );
}
