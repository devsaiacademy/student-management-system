"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Badge } from "@student-management-system/ui/components/badge";
import { cn } from "@student-management-system/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type StudentCardProps = {
  student: {
    id: number;
    name: string;
    rollNumber: string;
    email: string;
    studentStatus: string;
    reachedUsBy: string;
  };
  index: number;
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
        className: "bg-surface-warning text-surface-warning-foreground",
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

export function StudentCard({ student, index }: StudentCardProps) {
  const username = student.email.split("@")[0];
  const status = getStatusBadge(student.studentStatus);

  return (
    <Link
      className={cn(
        "group flex items-start gap-3 rounded-[12px] border border-border bg-background px-4 py-4 sm:items-center sm:gap-4 sm:px-5",
        "transition-all duration-200 hover:border-primary/30 hover:shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      href={`/admin/all-students/student/${student.id}` as Route}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "backwards",
      }}
    >
      <Avatar className="size-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-sm font-medium leading-tight text-foreground">
              {student.name}
            </span>
            <span className="min-w-0 truncate text-sm leading-tight text-muted-foreground">
              @{username}
            </span>
          </div>
          <span className="mt-0.5 text-xs leading-tight text-muted-foreground">
            Rollno:{student.rollNumber}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "rounded-full border-0 px-3 py-0.5 text-xs font-medium",
              status.className
            )}
            variant="outline"
          >
            {status.label}
          </Badge>
          <Badge
            className="rounded-full border-0 bg-orange-100/80 px-3 py-0.5 text-xs font-medium text-orange-700"
            variant="outline"
          >
            {student.reachedUsBy}
          </Badge>
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
