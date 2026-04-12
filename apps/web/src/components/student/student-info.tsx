"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Badge } from "@student-management-system/ui/components/badge";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";

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
      };
    case "in_active":
      return {
        label: "Inactive",
        className: "bg-slate-100 text-slate-600",
      };
    case "discontinue":
      return {
        label: "Discontinued",
        className: "bg-red-100/80 text-red-700",
      };
    default:
      return { label: status, className: "bg-slate-100 text-slate-600" };
  }
}

export function StudentInfo({ isAdmin, studentId }: StudentInfoProps) {
  const { data, isPending, isError } = useQuery(
    trpc.students.getStudentInfo.queryOptions({ studentId }),
  );

  if (isPending) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
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

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-12" size="lg">
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {getInitials(data.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-foreground">
            {data.name}
          </span>
          {isAdmin && (
            <Badge
              className={cn(
                "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium",
                status.className,
              )}
              variant="outline"
            >
              {status.label}
            </Badge>
          )}
          {isAdmin && (
            <Badge
              className="rounded-full border-0 bg-orange-100/80 px-2.5 py-0.5 text-[11px] font-medium text-orange-700"
              variant="outline"
            >
              {data.studentSource}
            </Badge>
          )}
          {isAdmin && (
            <Badge
              className={cn(
                "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium",
                data.kitProvided
                  ? "bg-blue-100/80 text-blue-700"
                  : "bg-slate-100 text-slate-600",
              )}
              variant="outline"
            >
              {data.kitProvided ? "Kit Provided" : "No Kit"}
            </Badge>
          )}
        </div>
        <span className="mt-0.5 text-[13px] text-muted-foreground">
          {data.email}
        </span>
        <span className="text-[13px] text-muted-foreground">
          +91 {data.phoneNumber}
        </span>
      </div>
    </div>
  );
}
