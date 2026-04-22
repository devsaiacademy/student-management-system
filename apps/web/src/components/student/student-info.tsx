"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Hash, Mail, Phone } from "lucide-react";

import { trpc } from "@/utils/trpc";

type StudentInfoProps = {
  isAdmin: boolean;
  studentId: number;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        className: "bg-emerald-100/80 text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "in_active":
      return {
        label: "Inactive",
        className: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
      };
    case "discontinue":
      return {
        label: "Discontinued",
        className: "bg-red-100/80 text-red-700",
        dot: "bg-red-500",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

export function StudentInfo({ isAdmin, studentId }: StudentInfoProps) {
  const { data, isPending, isError } = useQuery(
    trpc.students.getStudentInfo.queryOptions({ studentId })
  );

  if (isPending) {
    return (
      <div className="w-full rounded-2xl border border-border bg-[#F5F5F5] p-5 shadow-lg shadow-black/5 sm:p-6">
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

  if (isError || !data) {
    return (
      <div className="text-sm text-destructive">
        Failed to load student info.
      </div>
    );
  }

  const status = getStatusBadge(data.studentStatus);
  const initials = getInitials(data.name);

  return (
    <div className="w-full rounded-2xl border border-border bg-[#F5F5F5] p-5 shadow-lg shadow-black/5 sm:p-6">
      <div className="flex min-w-0 items-start gap-5">
        <Avatar className="size-16" size="lg">
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h2 className="text-xl font-semibold leading-tight text-foreground">
            {data.name}
          </h2>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  status.className
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-1.5 rounded-full", status.dot)}
                />
                {status.label}
              </span>
              <span className="rounded-full bg-orange-100/80 px-2.5 py-0.5 text-[11px] font-medium text-orange-700">
                {data.studentSource}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  data.kitProvided
                    ? "bg-blue-100/80 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {data.kitProvided ? "Kit Provided" : "No Kit"}
              </span>
              {data.kitProvided && data.kitCost === 0 && (
                <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  Complementary
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-[13px] text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            <span className="flex min-w-0 items-center gap-1.5">
              <Mail aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{data.email}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone aria-hidden className="size-3.5 shrink-0" />+91{" "}
              {data.phoneNumber}
            </span>
            <span className="flex items-center gap-1.5">
              <Hash aria-hidden className="size-3.5 shrink-0" />
              {data.rollNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
