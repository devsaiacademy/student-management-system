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
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "in_active":
      return {
        label: "Inactive",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "discontinue":
      return {
        label: "Discontinued",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    default:
      return { label: status, className: "" };
  }
}

export function StudentCard({ student, index }: StudentCardProps) {
  const status = getStatusBadge(student.studentStatus);
  const username = student.email.split("@")[0];

  return (
    <Link
      href={`/admin/students/${student.id}` as Route}
      className={cn(
        "group flex items-center gap-4 border-b border-border px-6 py-4",
        "transition-all duration-200 hover:bg-muted/50",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "backwards",
      }}
    >
      <Avatar className="size-10 transition-transform duration-200 group-hover:scale-105">
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {student.name}
          </span>
          <span className="text-xs text-muted-foreground">@{username}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Rollno:{student.rollNumber}
        </span>
      </div>

      <Badge
        variant="outline"
        className={cn("rounded-full text-xs", status.className)}
      >
        {status.label}
      </Badge>

      <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
