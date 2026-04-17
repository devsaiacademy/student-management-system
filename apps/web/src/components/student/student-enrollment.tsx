"use client";

import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

type StudentEnrollmentProps = {
  isAdmin: boolean;
  studentId: number;
  schoolName?: string;
  standard?: string;
  academicYear?: string;
  tutorName?: string;
};

const CARD_BG =
  "rounded-xl bg-surface-info text-surface-info-foreground p-5 sm:p-6 md:p-8";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const BIG_VALUE =
  "mt-1 break-words text-[18px] font-semibold text-foreground md:text-[20px]";
const SMALL_VALUE = "mt-0.5 break-words text-[14px] text-foreground";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function FieldSkeleton({ big }: { big?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className={cn("rounded", big ? "h-6 w-32" : "h-4 w-24")} />
    </div>
  );
}

const MAX_SCHOOL_NAME_LENGTH = 28;

function truncateSchoolName(name: string) {
  if (name.length <= MAX_SCHOOL_NAME_LENGTH) {
    return name;
  }
  return `${name.slice(0, MAX_SCHOOL_NAME_LENGTH).trimEnd()}…`;
}

export function StudentEnrollment({
  isAdmin,
  studentId,
  schoolName,
  standard,
  academicYear,
}: StudentEnrollmentProps) {
  const { data, isPending, isError } = useQuery(
    trpc.enrollments.getStudentEnrollment.queryOptions({ studentId })
  );

  if (isPending) {
    return (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">Failed to load enrollment.</div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-surface-info text-surface-info-foreground px-6 py-10 text-center text-sm text-muted-foreground">
        No enrollment found.
      </div>
    );
  }

  const { enrollment, progress } = data;
  const planLabel =
    enrollment.paymentPlan === "single"
      ? "Single payment"
      : `${enrollment.emiMonths ?? progress.totalCount} split payments`;

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className={cn(CARD_BG, "relative")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-6 md:gap-y-7 lg:grid-cols-5">
          <div>
            <p className={LABEL}>Enrolled Course</p>
            <p className={BIG_VALUE}>{enrollment.course}</p>
          </div>
          <div>
            <p className={LABEL}>Duration</p>
            <p className={BIG_VALUE}>{enrollment.duration}</p>
          </div>
          <div>
            <p className={LABEL}>Level</p>
            <p className={BIG_VALUE}>{enrollment.level}</p>
          </div>
          <div>
            <p className={LABEL}>Total Fee</p>
            <p className={SMALL_VALUE}>
              {formatCurrency(enrollment.totalFees)}
            </p>
          </div>

          <div>
            <p className={LABEL}>Plan</p>
            <p className={SMALL_VALUE}>{planLabel}</p>
          </div>
          <div>
            <p className={LABEL}>Starts</p>
            <p className={SMALL_VALUE}>{formatDate(progress.startDate)}</p>
          </div>

          {isAdmin && schoolName && (
            <div className="min-w-0">
              <p className={LABEL}>School</p>
              <p className={SMALL_VALUE} title={schoolName}>
                {truncateSchoolName(schoolName)}
              </p>
            </div>
          )}
          {isAdmin && standard && (
            <div>
              <p className={LABEL}>Standard</p>
              <p className={SMALL_VALUE}>{standard}</p>
            </div>
          )}
          {isAdmin && academicYear && (
            <div>
              <p className={LABEL}>Academic Year</p>
              <p className={SMALL_VALUE}>{academicYear}</p>
            </div>
          )}

          {data.enrollment.tutorName && (
            <div>
              <p className={LABEL}>Tutor Name</p>
              <p className={SMALL_VALUE}>{data.enrollment.tutorName}</p>
            </div>
          )}
        </div>
      </div>

      <div className={CARD_BG}>
        <div className="flex h-full flex-col justify-center gap-3">
          <p className={LABEL}>Payment Progress</p>
          <p className="text-xl font-semibold leading-tight text-foreground sm:text-[22px] md:text-[26px]">
            {progress.paidCount} of {progress.totalCount} paid
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {formatCurrency(progress.totalPaid)} paid so far.
            {progress.nextDueDate ? (
              <> Next installment due on {formatDate(progress.nextDueDate)}.</>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
