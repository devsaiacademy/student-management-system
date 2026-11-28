import { Skeleton } from "@student-management-system/ui/components/skeleton";

const CARD = "rounded-2xl bg-white p-5 shadow-sm sm:p-6";
const PAYMENT_ROW_COUNT = 5;
const DETAIL_ROW_COUNT = 9;
const FEE_COUNT = 3;
const STAT_COUNT = 4;

function CardTitleSkeleton({ width }: { width: string }) {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className={`h-5 rounded ${width}`} />
      <Skeleton className="size-4 rounded" />
    </div>
  );
}

// Fees card loading state: title only on phones (the card starts collapsed
// there), full stats + fee rings from sm up.
export function FeesCardSkeleton() {
  return (
    <section className={CARD}>
      <CardTitleSkeleton width="w-16" />
      <div className="hidden sm:block">
        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: STAT_COUNT }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
            <div className="flex flex-col gap-2" key={index}>
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-7 w-28 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-3 md:gap-6">
          {Array.from({ length: FEE_COUNT }).map((_, index) => (
            <div
              className="flex items-center gap-4 md:flex-col md:gap-3"
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              key={index}
            >
              <Skeleton className="size-16 shrink-0 rounded-full md:order-2 md:size-[120px]" />
              <div className="flex flex-1 flex-col gap-2 md:contents">
                <Skeleton className="h-4 w-24 rounded md:order-1" />
                <Skeleton className="h-3 w-40 rounded md:order-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Enrollment card loading state, collapsed to its title on phones.
export function EnrollmentCardSkeleton() {
  return (
    <section className={CARD}>
      <CardTitleSkeleton width="w-24" />
      <div className="mt-2 hidden flex-col divide-y divide-border sm:flex">
        {Array.from({ length: DETAIL_ROW_COUNT }).map((_, index) => (
          <div
            className="flex h-9 items-center justify-between"
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
            key={index}
          >
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

// Route-level loading state that mirrors StudentDetail: header (a card on
// phones, plain from md up), Fees + Enrollment (collapsed to their titles on
// phones, open from sm up), then the payments table.
export function StudentDetailSkeleton() {
  return (
    <div className="min-h-full bg-neutral-50 px-4 pt-4 pb-10 sm:px-6 md:px-10 md:pt-8">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <Skeleton className="h-6 w-40 max-w-full rounded" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-x-5">
                <Skeleton className="h-4 w-48 max-w-full rounded" />
                <Skeleton className="h-4 w-32 max-w-full rounded" />
                <Skeleton className="h-4 w-24 max-w-full rounded" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <FeesCardSkeleton />

          <EnrollmentCardSkeleton />
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {Array.from({ length: PAYMENT_ROW_COUNT }).map((_, index) => (
            <div
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 last:border-b-0"
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              key={index}
            >
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="hidden h-4 w-24 rounded sm:block" />
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
