import { Skeleton } from "@student-management-system/ui/components/skeleton";

const CARD_BG = "rounded-2xl bg-white p-4 sm:p-5 md:p-6";
const PAYMENT_ROW_COUNT = 5;
const RING_SIZE = 160;

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-5 w-28 rounded" />
    </div>
  );
}

function InfoCardSkeleton() {
  return (
    <div className={CARD_BG}>
      <div className="flex min-w-0 items-start gap-5">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Skeleton className="h-6 w-40 max-w-full rounded" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <Skeleton className="h-4 w-48 max-w-full rounded" />
            <Skeleton className="h-4 w-32 max-w-full rounded" />
            <Skeleton className="h-4 w-24 max-w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrollmentCardSkeleton() {
  return (
    <div className={CARD_BG}>
      <Skeleton className="h-3 w-36 rounded" />
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-5 md:mt-6 md:gap-x-6 md:gap-y-7 xl:grid-cols-4">
        {Array.from({ length: 9 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
          <FieldSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function RingCardSkeleton() {
  return (
    <div className={`${CARD_BG} flex h-full flex-col`}>
      <Skeleton className="h-3 w-32 rounded" />
      <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-5 py-2 sm:py-4">
        <Skeleton
          className="rounded-full"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        />
        <Skeleton className="h-3 w-48 max-w-full rounded" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-full bg-neutral-50 px-4 pt-14 pb-10 sm:px-6 md:px-10 md:pt-8">
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_280px_280px] xl:items-stretch">
        <div className="flex flex-col gap-4 sm:gap-6 xl:col-span-1">
          <InfoCardSkeleton />
          <EnrollmentCardSkeleton />
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6 xl:contents">
          <div className="grid flex-1 basis-[280px] sm:min-h-[320px]">
            <RingCardSkeleton />
          </div>
          <div className="grid flex-1 basis-[280px] sm:min-h-[320px]">
            <RingCardSkeleton />
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
  );
}
