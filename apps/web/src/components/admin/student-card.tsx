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
    studentSource: string;
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

export function StudentCard({ student, index }: StudentCardProps) {
  const username = student.email.split("@")[0];
  const status = getStatusBadge(student.studentStatus);

  return (
    <Link
      className={cn(
        "group flex items-center gap-4 rounded-[12px] border border-border bg-background px-5 py-4",
        "transition-all duration-200 hover:border-primary/30 hover:shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      href={`/admin/students/${student.id}` as Route}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "backwards",
      }}
    >
      <Avatar className="size-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-semibold leading-tight text-foreground">
            {student.name}
          </span>
          <span className="text-[13px] leading-tight text-muted-foreground">
            @{username}
          </span>
        </div>
        <span className="mt-0.5 text-[12px] leading-tight text-muted-foreground">
          Rollno:{student.rollNumber}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "rounded-full border-0 px-3 py-0.5 text-[11px] font-medium",
            status.className
          )}
          variant="outline"
        >
          {status.label}
        </Badge>
        <Badge
          className="rounded-full border-0 bg-orange-100/80 px-3 py-0.5 text-[11px] font-medium text-orange-700"
          variant="outline"
        >
          {student.studentSource}
        </Badge>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
