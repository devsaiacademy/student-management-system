"use client";

import { CircularProgress } from "@student-management-system/ui/components/circular-progress";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { useIsMobile } from "@student-management-system/ui/hooks/use-mobile";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { trpc } from "@/utils/trpc";

import { JoiningDateAction } from "./joining-date-action";
import {
  EnrollmentCardSkeleton,
  FeesCardSkeleton,
} from "./student-detail-skeleton";
import { formatCurrency } from "./student-payment";

const CARD = "rounded-2xl bg-white p-5 shadow-sm sm:p-6";
const CARD_TITLE = "text-base font-medium text-foreground";
const PERCENT = 100;

type FeeStatus = "paid" | "unpaid" | "overdue" | "partially_paid";

type FeeSummary = {
  amount: number;
  amountPaid: number;
  paymentStatus: FeeStatus;
  dueDate: string;
} | null;

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

function paidOf(fee: FeeSummary) {
  if (!fee) {
    return 0;
  }
  return fee.paymentStatus === "paid" ? fee.amount : fee.amountPaid;
}

function courseStatus(progress: {
  paidCount: number;
  totalCount: number;
  totalPaid: number;
  hasOverdue: boolean;
}): FeeStatus {
  if (progress.totalCount > 0 && progress.paidCount === progress.totalCount) {
    return "paid";
  }
  if (progress.hasOverdue) {
    return "overdue";
  }
  return progress.totalPaid > 0 ? "partially_paid" : "unpaid";
}

// Earliest due date among everything still owed (course, kit, component).
function nextDueDate(
  courseNext: string | null,
  fees: FeeSummary[]
): string | null {
  const candidates = [
    courseNext,
    ...fees
      .filter((fee) => fee && fee.amount > 0 && fee.paymentStatus !== "paid")
      .map((fee) => fee?.dueDate ?? null),
  ].filter((date): date is string => Boolean(date));
  if (candidates.length === 0) {
    return null;
  }
  // dueDate strings are "YYYY-MM-DD", so lexical order is chronological.
  return candidates.reduce((min, date) => (date < min ? date : min));
}

const COLLAPSE_EASE =
  "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

const STORAGE_PREFIX = "student-detail:card:";
// Tailwind's `sm` breakpoint: below it cards start collapsed, above it open.
const WIDE_QUERY = "(min-width: 640px)";

function readStoredOpen(key: string): boolean | null {
  try {
    const value = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (value === "open") {
      return true;
    }
    if (value === "closed") {
      return false;
    }
  } catch {
    // Storage blocked (private mode etc.): fall back to the default.
  }
  return null;
}

function storeOpen(key: string, open: boolean) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, open ? "open" : "closed");
  } catch {
    // Not persisted; the toggle still works for this visit.
  }
}

// Card whose body collapses behind its title. Until the viewer toggles it,
// it starts collapsed on phones and open from sm up; after that, their
// choice is remembered in localStorage per card.
function CollapsibleSection({
  title,
  aside,
  fill = false,
  children,
}: {
  title: string;
  aside?: ReactNode;
  // When open on xl, stretch to the grid row height (the Fees card) and let
  // the body fill it, so both cards end on the same line.
  fill?: boolean;
  children: ReactNode;
}) {
  // null = no saved choice yet, so the breakpoint default (CSS) applies.
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setOpen(readStoredOpen(title));
  }, [title]);

  const toggle = () => {
    const current = open ?? window.matchMedia(WIDE_QUERY).matches;
    const next = !current;
    setOpen(next);
    storeOpen(title, next);
  };

  return (
    <section
      className={cn(
        CARD,
        fill && open !== false && "xl:flex xl:flex-col xl:self-stretch"
      )}
    >
      <h2 className={CARD_TITLE}>
        <button
          aria-expanded={open ?? undefined}
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={toggle}
          type="button"
        >
          {title}
          <span className="flex items-center gap-2 font-normal">
            {aside}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                COLLAPSE_EASE,
                open === null && "sm:rotate-180",
                open === true && "rotate-180"
              )}
            />
          </span>
        </button>
      </h2>
      <div
        className={cn(
          "grid transition-[grid-template-rows]",
          COLLAPSE_EASE,
          fill && "xl:flex-1",
          open === null && "grid-rows-[0fr] sm:grid-rows-[1fr]",
          open === true && "grid-rows-[1fr]",
          open === false && "grid-rows-[0fr]"
        )}
      >
        {/* invisible (after the collapse finishes) keeps hidden content out
            of tab order and screen readers. */}
        <div
          className={cn(
            "min-h-0 overflow-hidden transition-[visibility]",
            COLLAPSE_EASE,
            fill && "xl:flex xl:flex-col",
            open === null && "max-sm:invisible",
            open === false && "invisible"
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "danger";
  hint?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 truncate text-xl font-semibold tracking-tight",
          tone === "default" && "text-foreground",
          tone === "success" && "text-emerald-700",
          tone === "danger" && "text-red-700"
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const RING_SIZE = 120;
const RING_STROKE = 11;
const MOBILE_RING_SIZE = 64;
const MOBILE_RING_STROKE = 7;
const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1000;

// Short INR so large amounts fit inside the ring (₹10L, ₹2.4K).
function formatCompactINR(amount: number) {
  const steps = [
    { size: CRORE, suffix: "Cr" },
    { size: LAKH, suffix: "L" },
    { size: THOUSAND, suffix: "K" },
  ];
  for (const { size, suffix } of steps) {
    if (amount >= size) {
      const value = amount / size;
      const display = amount % size === 0 ? value.toFixed(0) : value.toFixed(1);
      return `₹${display}${suffix}`;
    }
  }
  return `₹${amount}`;
}

type RingTone = "primary" | "success" | "destructive" | "muted";

function toneFor(status: FeeStatus): RingTone {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "destructive";
    case "partially_paid":
      return "primary";
    default:
      return "muted";
  }
}

function FeeRing({
  title,
  total,
  tone,
  value,
  center,
  caption,
  mobileCaption,
}: {
  title: string;
  total: string;
  tone: RingTone;
  value: number;
  center: ReactNode;
  caption: ReactNode;
  mobileCaption?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const label = `${title}: ${Math.round(value * PERCENT)}% paid`;

  // Phones: a compact row (small ring + text) instead of a tall column, so
  // three fees don't stack into a long scroll.
  if (isMobile) {
    let mini: ReactNode;
    if (tone === "muted" && value === 0 && total === "No fee") {
      mini = <span className="text-sm text-muted-foreground">—</span>;
    } else if (value >= 1) {
      mini = (
        <Check
          aria-hidden
          className="size-5 text-[color:var(--surface-success-foreground)]"
        />
      );
    } else {
      mini = (
        <span className="text-xs font-medium text-foreground">
          {Math.round(value * PERCENT)}%
        </span>
      );
    }
    return (
      <div className="flex items-center gap-4">
        <CircularProgress
          label={label}
          size={MOBILE_RING_SIZE}
          strokeWidth={MOBILE_RING_STROKE}
          tone={tone}
          value={value}
        >
          {mini}
        </CircularProgress>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="shrink-0 text-sm text-muted-foreground">{total}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {mobileCaption ?? caption}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{total}</p>
      </div>
      <CircularProgress
        label={label}
        size={RING_SIZE}
        strokeWidth={RING_STROKE}
        tone={tone}
        value={value}
      >
        {center}
      </CircularProgress>
      <div className="text-xs text-muted-foreground">{caption}</div>
    </div>
  );
}

const FEE_SUFFIX = / fee$/;

// Scales the headline amount down as it grows so it stays inside the ring.
function ringAmountClass(text: string) {
  if (text.length <= 10) {
    return "text-base";
  }
  return "text-sm";
}

function RingHeadline({ amount }: { amount: number }) {
  const text = formatCompactINR(amount);
  return (
    <span
      className={cn(
        "font-medium leading-tight text-foreground",
        ringAmountClass(text)
      )}
    >
      {text}
    </span>
  );
}

function PaidCheck({ amount }: { amount?: number }) {
  return (
    <>
      <Check
        aria-hidden
        className="size-8 text-[color:var(--surface-success-foreground)]"
      />
      {amount === undefined ? null : (
        <span className="mt-1 text-xs text-muted-foreground">
          {formatCompactINR(amount)}
        </span>
      )}
    </>
  );
}

function CourseRing({
  progress,
}: {
  progress: {
    paidCount: number;
    totalCount: number;
    totalPaid: number;
    totalDue: number;
    hasOverdue: boolean;
    nextDueDate: string | null;
    oldestOverdueDate: string | null;
  };
}) {
  const status = courseStatus(progress);
  const value =
    progress.totalDue > 0 ? progress.totalPaid / progress.totalDue : 0;

  let caption: string;
  if (progress.totalCount === 0) {
    caption = "No payment schedule";
  } else if (status === "paid") {
    caption = "All installments paid";
  } else if (progress.hasOverdue) {
    caption = `Payment overdue since ${formatDate(progress.oldestOverdueDate)}`;
  } else if (progress.nextDueDate) {
    caption = `Next installment due on ${formatDate(progress.nextDueDate)}`;
  } else {
    caption = `${progress.paidCount} of ${progress.totalCount} paid`;
  }

  let center: ReactNode;
  if (progress.totalCount === 0) {
    center = <span className="text-xl text-muted-foreground">—</span>;
  } else if (status === "paid") {
    center = <PaidCheck amount={progress.totalDue} />;
  } else {
    center = (
      <>
        <span className="text-base font-medium text-foreground">
          {formatCompactINR(progress.totalPaid)} paid
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">
          {progress.paidCount} of {progress.totalCount} paid
        </span>
      </>
    );
  }

  return (
    <FeeRing
      caption={caption}
      center={center}
      mobileCaption={
        progress.totalCount > 0 && status !== "paid"
          ? `${progress.paidCount} of ${progress.totalCount} paid · ${caption}`
          : caption
      }
      title="Course fee"
      tone={toneFor(status)}
      total={formatCurrency(progress.totalDue)}
      value={value}
    />
  );
}

function ExtraFeeRing({ title, fee }: { title: string; fee: FeeSummary }) {
  // "Kit fee" -> "Kit", for captions like "Kit included with enrollment".
  const noun = title.replace(FEE_SUFFIX, "");
  if (!fee) {
    return (
      <FeeRing
        caption="Not part of this enrollment"
        center={<span className="text-xl text-muted-foreground">—</span>}
        title={title}
        tone="muted"
        total="No fee"
        value={0}
      />
    );
  }
  if (fee.amount === 0) {
    return (
      <FeeRing
        caption={`${noun} included with enrollment`}
        center={<PaidCheck />}
        title={title}
        tone="success"
        total="Free"
        value={1}
      />
    );
  }

  const paid = paidOf(fee);
  const remaining = fee.amount - paid;
  let center: ReactNode;
  let caption: string;
  switch (fee.paymentStatus) {
    case "paid":
      center = <PaidCheck amount={fee.amount} />;
      caption = `${title} paid`;
      break;
    case "overdue":
      center = (
        <>
          <RingHeadline amount={remaining} />
          <span className="mt-0.5 text-xs font-medium text-[color:var(--surface-destructive-foreground)]">
            Overdue
          </span>
        </>
      );
      caption = `Overdue since ${formatDate(fee.dueDate)}`;
      break;
    case "partially_paid":
      center = (
        <>
          <RingHeadline amount={remaining} />
          <span className="mt-0.5 text-xs text-muted-foreground">
            due of {formatCompactINR(fee.amount)}
          </span>
          <span className="mt-1 text-xs font-medium text-amber-700">
            {formatCompactINR(paid)} paid
          </span>
        </>
      );
      caption = `${title} due on ${formatDate(fee.dueDate)}`;
      break;
    default:
      center = (
        <>
          <RingHeadline amount={fee.amount} />
          <span className="mt-0.5 text-xs text-muted-foreground">due</span>
        </>
      );
      caption = `${title} due on ${formatDate(fee.dueDate)}`;
  }

  return (
    <FeeRing
      caption={caption}
      center={center}
      title={title}
      tone={toneFor(fee.paymentStatus)}
      total={formatCurrency(fee.amount)}
      value={paid / fee.amount}
    />
  );
}

// One place for the whole money picture: totals, progress and a breakdown
// of course, kit and component fees.
export function FeesCard({ studentId }: { studentId: number }) {
  const { data, isPending, isError } = useQuery(
    trpc.enrollments.getStudentEnrollment.queryOptions({ studentId })
  );

  if (isPending) {
    return <FeesCardSkeleton />;
  }
  if (isError) {
    return (
      <section className={CARD}>
        <p className="text-sm text-destructive">Failed to load fees.</p>
      </section>
    );
  }
  if (!data) {
    return (
      <section className={CARD}>
        <h2 className={CARD_TITLE}>Fees</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No enrollment found.
        </p>
      </section>
    );
  }

  const { enrollment, progress, kit, components } = data;
  const fees: FeeSummary[] = [kit, components];
  const total =
    progress.totalDue + (kit?.amount ?? 0) + (components?.amount ?? 0);
  const paid = progress.totalPaid + paidOf(kit) + paidOf(components);
  const outstanding = Math.max(total - paid, 0);
  const paidPercent = total > 0 ? Math.round((paid / total) * PERCENT) : 0;
  const isOverdue =
    progress.hasOverdue || fees.some((fee) => fee?.paymentStatus === "overdue");
  const nextDue = nextDueDate(progress.nextDueDate, fees);
  const planLabel =
    enrollment.paymentPlan === "single"
      ? "Single payment"
      : `${enrollment.emiMonths ?? progress.totalCount} installments`;

  let nextDueValue = "—";
  let nextDueHint: string | undefined;
  if (outstanding === 0) {
    nextDueValue = "All paid";
  } else if (isOverdue) {
    nextDueValue = formatDate(progress.oldestOverdueDate ?? nextDue);
    nextDueHint = "Overdue";
  } else if (nextDue) {
    nextDueValue = formatDate(nextDue);
  }

  return (
    <CollapsibleSection
      aside={<span className="text-sm text-muted-foreground">{planLabel}</span>}
      title="Fees"
    >
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat
          hint="Course + Kit + Component"
          label="Total fee"
          value={formatCurrency(total)}
        />
        <Stat
          hint={`${paidPercent}% of total`}
          label="Paid"
          tone="success"
          value={formatCurrency(paid)}
        />
        <Stat
          label="Outstanding"
          tone={isOverdue ? "danger" : "default"}
          value={formatCurrency(outstanding)}
        />
        <Stat
          hint={nextDueHint}
          label="Next due"
          tone={isOverdue ? "danger" : "default"}
          value={nextDueValue}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-3 md:gap-6">
        <CourseRing progress={progress} />
        <ExtraFeeRing fee={kit} title="Kit fee" />
        <ExtraFeeRing fee={components} title="Component fee" />
      </div>
    </CollapsibleSection>
  );
}

function DetailRow({
  label,
  children,
  title,
}: {
  label: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-h-9 flex-1 items-center justify-between gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd
        className="min-w-0 truncate text-right text-sm font-medium text-foreground"
        title={title}
      >
        {children}
      </dd>
    </div>
  );
}

// Facts about the enrollment itself: what, where and when.
export function EnrollmentCard({
  studentId,
  isAdmin,
}: {
  studentId: number;
  isAdmin: boolean;
}) {
  const { data, isPending, isError } = useQuery(
    trpc.enrollments.getStudentEnrollment.queryOptions({ studentId })
  );
  const { data: student } = useQuery(
    trpc.students.getStudentInfo.queryOptions({ studentId })
  );

  if (isPending) {
    return <EnrollmentCardSkeleton />;
  }
  if (isError) {
    return (
      <section className={CARD}>
        <p className="text-sm text-destructive">Failed to load enrollment.</p>
      </section>
    );
  }
  if (!data) {
    return null;
  }

  const { enrollment, progress } = data;

  return (
    <CollapsibleSection fill title="Enrollment">
      <dl className="mt-2 flex flex-1 flex-col divide-y divide-border">
        <DetailRow label="Course">{enrollment.course}</DetailRow>
        <DetailRow label="Duration">{enrollment.duration}</DetailRow>
        <DetailRow label="Level">{enrollment.level}</DetailRow>
        {isAdmin && student?.schoolName ? (
          <DetailRow label="School" title={student.schoolName}>
            {student.schoolName}
          </DetailRow>
        ) : null}
        {isAdmin && student?.standard ? (
          <DetailRow label="Standard">{student.standard}</DetailRow>
        ) : null}
        {isAdmin && student?.academicYear ? (
          <DetailRow label="Academic year">{student.academicYear}</DetailRow>
        ) : null}
        <DetailRow label="Admission date">
          {formatDate(progress.admissionDate)}
        </DetailRow>
        <DetailRow label="Joining date">
          {isAdmin ? (
            <JoiningDateAction
              admissionDate={progress.admissionDate}
              enrollmentId={enrollment.id}
              isLocked={progress.isJoiningDateLocked}
              joiningDate={progress.joiningDate}
              studentId={studentId}
            />
          ) : (
            formatDate(progress.joiningDate)
          )}
        </DetailRow>
        {isAdmin && enrollment.closedBy ? (
          <DetailRow label="Closed by">{enrollment.closedBy}</DetailRow>
        ) : null}
      </dl>
    </CollapsibleSection>
  );
}
