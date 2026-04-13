"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Badge } from "@student-management-system/ui/components/badge";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { cn } from "@student-management-system/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Hash } from "lucide-react";

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
    trpc.students.getStudentInfo.queryOptions({ studentId })
  );

  if (isPending) {
    return (
      <div className="flex items-center gap-5">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
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

  return (
    <div className="flex items-center gap-5">
      <Avatar className="size-14" size="lg">
        <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
          {getInitials(data.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            {data.name}
          </h2>
          {isAdmin && (
            <Badge
              className={cn(
                "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium",
                status.className
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
                  : "bg-slate-100 text-slate-600"
              )}
              variant="outline"
            >
              {data.kitProvided ? "Kit Provided" : "No Kit"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-5 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail aria-hidden className="size-3.5" />
            {data.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone aria-hidden className="size-3.5" />
            +91 {data.phoneNumber}
          </span>
          <span className="flex items-center gap-1.5">
            <Hash aria-hidden className="size-3.5" />
            {data.rollNumber}
          </span>
        </div>
      </div>
    </div>
  );
}
