"use client";

import {
  Card,
  CardContent,
} from "@student-management-system/ui/components/card";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

type StudentEnrollmentProps = {
  studentId: number;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN");
}

function EnrollmentFieldSkeletons() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
        <div className="flex flex-col gap-2" key={index}>
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
      ))}
    </>
  );
}

export function StudentEnrollment({ studentId }: StudentEnrollmentProps) {
  const { data, isPending, isError } = useQuery(
    trpc.billing.getStudentEnrollment.queryOptions({ studentId })
  );

  if (isPending) {
    return (
      <div className="flex gap-4">
        <Card className="flex-1 rounded-lg border border-border shadow-none">
          <CardContent className="grid grid-cols-3 gap-5 p-6">
            <EnrollmentFieldSkeletons />
          </CardContent>
        </Card>
        <Card className="w-[260px] shrink-0 rounded-lg border border-border border-l-4 border-l-primary shadow-none">
          <CardContent className="flex flex-col gap-2 p-6">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
          </CardContent>
        </Card>
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
      <div className="rounded-lg border border-border bg-background px-6 py-8 text-center text-sm text-muted-foreground">
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
    <div className="flex gap-4">
      <Card className="flex-1 rounded-lg border border-border shadow-none">
        <CardContent className="grid grid-cols-3 gap-y-5 p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Enrolled Course
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {enrollment.course}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {enrollment.duration}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Level
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {enrollment.level}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Starts
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatDate(progress.startDate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ends
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatDate(progress.endDate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Fee
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {formatCurrency(enrollment.totalFees)}
            </p>
          </div>

          <div className="col-start-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plan
            </p>
            <p className="mt-0.5 text-sm text-foreground">{planLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "w-[260px] shrink-0 rounded-lg border border-border shadow-none",
          "border-l-4 border-l-primary"
        )}
      >
        <CardContent className="flex h-full flex-col justify-center p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Progress
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {progress.paidCount} of {progress.totalCount} paid
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {formatCurrency(progress.totalPaid)} paid so far.
            {progress.nextDueDate ? (
              <> Next installment due on {formatDate(progress.nextDueDate)}.</>
            ) : null}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
