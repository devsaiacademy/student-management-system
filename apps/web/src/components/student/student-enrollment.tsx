"use client";

import { CircularProgress } from "@student-management-system/ui/components/circular-progress";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";

import { trpc } from "@/utils/trpc";

const CARD_BG = "rounded-2xl bg-white p-4 sm:p-5 md:p-6";
const LABEL =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const VALUE = "mt-1 break-words text-base font-semibold text-foreground";
const RING_SIZE = 160;
const RING_STROKE = 14;

const MAX_SCHOOL_NAME_LENGTH = 28;
const LAKH = 100_000;
const THOUSAND = 1_000;

type EnrollmentCardProps = {
  studentId: number;
  isAdmin: boolean;
  schoolName?: string;
  standard?: string;
  academicYear?: string;
};

type SimpleCardProps = {
  studentId: number;
};

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

function formatCompactINR(amount: number) {
  if (amount >= LAKH) {
    const value = amount / LAKH;
    const display = amount % LAKH === 0 ? value.toFixed(0) : value.toFixed(1);
    return `₹${display}L`;
  }
  if (amount >= THOUSAND) {
    const value = amount / THOUSAND;
    const display =
      amount % THOUSAND === 0 ? value.toFixed(0) : value.toFixed(1);
    return `₹${display}K`;
  }
  return `₹${amount}`;
}

function truncateSchoolName(name: string) {
  if (name.length <= MAX_SCHOOL_NAME_LENGTH) {
    return name;
  }
  return `${name.slice(0, MAX_SCHOOL_NAME_LENGTH).trimEnd()}…`;
}

function CollapsibleCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prev) => !prev);
  return (
    <div
      aria-expanded={open}
      aria-label={`Toggle ${title}`}
      className={cn(
        CARD_BG,
        "flex cursor-pointer flex-col sm:cursor-auto",
        className
      )}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={LABEL}>{title}</p>
        <ChevronDown
          aria-hidden
          className={cn(
            "-mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:hidden",
            open && "rotate-180"
          )}
        />
      </div>
      <div
        aria-hidden={!open}
        className={cn(
          "grid flex-1 transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:flex sm:flex-col",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="w-full overflow-hidden sm:flex sm:flex-1 sm:flex-col">
          <div
            className={cn(
              "mt-3 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:mt-0 sm:flex sm:flex-1 sm:flex-col sm:translate-y-0 sm:opacity-100",
              open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-5 w-28 rounded" />
    </div>
  );
}

function CardError({ message }: { message: string }) {
  return <div className="text-sm text-destructive">{message}</div>;
}

function CardEmpty({ message }: { message: string }) {
  return (
    <div
      className={cn(
        CARD_BG,
        "px-6 py-10 text-center text-sm text-muted-foreground"
      )}
    >
      {message}
    </div>
  );
}

function RingCardLayout({
  title,
  ring,
  subtitle,
}: {
  title: string;
  ring: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <CollapsibleCard className="h-full" title={title}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2 text-center sm:py-4">
        {ring}
        <p className="max-w-[28ch] text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </CollapsibleCard>
  );
}

function RingCardSkeleton({ title }: { title: string }) {
  return (
    <div className={cn(CARD_BG, "flex h-full flex-col")}>
      <Skeleton aria-label={title} className="h-3 w-32 rounded" />
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

export function EnrollmentDetailsCard({
  studentId,
  isAdmin,
  schoolName,
  standard,
  academicYear,
}: EnrollmentCardProps) {
  const { data, isPending, isError } = useQuery(
    trpc.enrollments.getStudentEnrollment.queryOptions({ studentId })
  );

  if (isPending) {
    const placeholderCount = isAdmin ? 9 : 6;
    return (
      <div className={CARD_BG}>
        <Skeleton className="h-3 w-36 rounded" />
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-5 md:mt-6 md:gap-x-6 md:gap-y-7 xl:grid-cols-4">
          {Array.from({ length: placeholderCount }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
            <FieldSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <CardError message="Failed to load enrollment." />;
  }

  if (!data) {
    return <CardEmpty message="No enrollment found." />;
  }

  const { enrollment, progress } = data;
  const planLabel =
    enrollment.paymentPlan === "single"
      ? "Single payment"
      : `${enrollment.emiMonths ?? progress.totalCount} split payments`;

  return (
    <CollapsibleCard className="relative" title="Enrollment Details">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-4 md:mt-6 md:gap-x-6 md:gap-y-7 xl:grid-cols-4">
        <div>
          <p className={LABEL}>Enrolled Course</p>
          <p className={VALUE}>{enrollment.course}</p>
        </div>
        <div>
          <p className={LABEL}>Duration</p>
          <p className={VALUE}>{enrollment.duration}</p>
        </div>
        <div>
          <p className={LABEL}>Level</p>
          <p className={VALUE}>{enrollment.level}</p>
        </div>
        {isAdmin && schoolName && (
          <div className="min-w-0">
            <p className={LABEL}>School</p>
            <p className={VALUE} title={schoolName}>
              {truncateSchoolName(schoolName)}
            </p>
          </div>
        )}
        {isAdmin && standard && (
          <div>
            <p className={LABEL}>Standard</p>
            <p className={VALUE}>{standard}</p>
          </div>
        )}
        {isAdmin && academicYear && (
          <div>
            <p className={LABEL}>Academic Year</p>
            <p className={VALUE}>{academicYear}</p>
          </div>
        )}
        <div>
          <p className={LABEL}>Total Fee</p>
          <p className={VALUE}>{formatCurrency(enrollment.totalFees)}</p>
        </div>
        <div>
          <p className={LABEL}>Plan</p>
          <p className={VALUE}>{planLabel}</p>
        </div>
        <div>
          <p className={LABEL}>Admission Date</p>
          <p className={VALUE}>{formatDate(progress.admissionDate)}</p>
        </div>
        {isAdmin && enrollment.closedBy && (
          <div>
            <p className={LABEL}>Closed By</p>
            <p className={VALUE}>{enrollment.closedBy}</p>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}

type PaymentTone = "primary" | "success" | "destructive" | "muted";

function getPaymentRingState(progress: {
  paidCount: number;
  totalCount: number;
  hasOverdue: boolean;
}): PaymentTone {
  if (progress.totalCount === 0) {
    return "muted";
  }
  if (progress.paidCount === progress.totalCount) {
    return "success";
  }
  if (progress.hasOverdue) {
    return "destructive";
  }
  return "primary";
}

export function PaymentProgressCard({ studentId }: SimpleCardProps) {
  const { data, isPending, isError } = useQuery(
    trpc.enrollments.getStudentEnrollment.queryOptions({ studentId })
  );

  if (isPending) {
    return <RingCardSkeleton title="Payment Progress" />;
  }
  if (isError) {
    return <CardError message="Failed to load payment progress." />;
  }
  if (!data) {
    return null;
  }

  const { enrollment, progress } = data;
  const tone = getPaymentRingState(progress);
  const value =
    enrollment.totalFees > 0 ? progress.totalPaid / enrollment.totalFees : 0;

  let subtitle: ReactNode;
  if (progress.totalCount === 0) {
    subtitle = "No payment schedule";
  } else if (progress.paidCount === progress.totalCount) {
    subtitle = "All installments paid";
  } else if (progress.hasOverdue) {
    subtitle = (
      <>Payment overdue since {formatDate(progress.oldestOverdueDate)}</>
    );
  } else if (progress.nextDueDate) {
    subtitle = <>Next installment due on {formatDate(progress.nextDueDate)}</>;
  } else {
    subtitle = `${progress.paidCount} of ${progress.totalCount} paid`;
  }

  return (
    <RingCardLayout
      ring={
        <CircularProgress
          label={`${progress.paidCount} of ${progress.totalCount} installments paid`}
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
          tone={tone}
          value={value}
        >
          {progress.totalCount === 0 ? (
            <span className="text-2xl font-semibold text-muted-foreground">
              —
            </span>
          ) : (
            <>
              <span className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                {formatCurrency(progress.totalPaid)}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                of {formatCompactINR(enrollment.totalFees)}
              </span>
              <span className="mt-2 text-xs font-medium text-muted-foreground">
                {progress.paidCount} of {progress.totalCount} paid
              </span>
            </>
          )}
        </CircularProgress>
      }
      subtitle={subtitle}
      title="Payment Progress"
    />
  );
}

type KitVariant =
  | { kind: "complimentary" }
  | { kind: "paid"; amount: number }
  | { kind: "overdue"; amount: number; dueDate: string }
  | { kind: "unpaid"; amount: number; dueDate: string };

function getKitVariant(data: {
  enrollment: { kitCost: number | null };
  kit: {
    amount: number;
    paymentStatus: "paid" | "unpaid" | "overdue";
    dueDate: string;
  } | null;
}): KitVariant | null {
  if (data.enrollment.kitCost === 0) {
    return { kind: "complimentary" };
  }
  if (!data.kit) {
    return null;
  }
  if (data.kit.paymentStatus === "paid") {
    return { kind: "paid", amount: data.kit.amount };
  }
  if (data.kit.paymentStatus === "overdue") {
    return {
      kind: "overdue",
      amount: data.kit.amount,
      dueDate: data.kit.dueDate,
    };
  }
  return {
    kind: "unpaid",
    amount: data.kit.amount,
    dueDate: data.kit.dueDate,
  };
}

export function KitDetailsCard({ studentId }: SimpleCardProps) {
  const { data, isPending, isError } = useQuery(
    trpc.enrollments.getStudentEnrollment.queryOptions({ studentId })
  );

  if (isPending) {
    return <RingCardSkeleton title="Kit Details" />;
  }
  if (isError) {
    return <CardError message="Failed to load kit details." />;
  }
  if (!data?.enrollment.kitProvided) {
    return null;
  }

  const variant = getKitVariant(data);
  if (!variant) {
    return null;
  }

  let tone: PaymentTone;
  let value: number;
  let center: ReactNode;
  let subtitle: ReactNode;

  switch (variant.kind) {
    case "complimentary":
      tone = "success";
      value = 1;
      center = (
        <Check
          aria-hidden
          className="size-12 text-[color:var(--surface-success-foreground)]"
        />
      );
      subtitle = "Kit included with enrollment";
      break;
    case "paid":
      tone = "success";
      value = 1;
      center = (
        <>
          <Check
            aria-hidden
            className="size-10 text-[color:var(--surface-success-foreground)]"
          />
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            {formatCurrency(variant.amount)}
          </span>
        </>
      );
      subtitle = "Kit fee paid";
      break;
    case "overdue":
      tone = "destructive";
      value = 0;
      center = (
        <>
          <span className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {formatCurrency(variant.amount)}
          </span>
          <span className="mt-1 text-xs font-medium text-[color:var(--surface-destructive-foreground)]">
            Overdue
          </span>
        </>
      );
      subtitle = <>Overdue since {formatDate(variant.dueDate)}</>;
      break;
    default:
      tone = "muted";
      value = 0;
      center = (
        <>
          <span className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {formatCurrency(variant.amount)}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">due</span>
        </>
      );
      subtitle = <>Kit fee due on {formatDate(variant.dueDate)}</>;
      break;
  }

  return (
    <RingCardLayout
      ring={
        <CircularProgress
          label={`Kit ${variant.kind}`}
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
          tone={tone}
          value={value}
        >
          {center}
        </CircularProgress>
      }
      subtitle={subtitle}
      title="Kit Details"
    />
  );
}
