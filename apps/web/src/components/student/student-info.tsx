"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

type StudentInfoProps = {
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

export function StudentInfo({ studentId }: StudentInfoProps) {
  const { data, isPending, isError } = useQuery(
    trpc.billing.getStudentInfo.queryOptions({ studentId })
  );

  if (isPending) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-3 w-28 rounded" />
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

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
          {getInitials(data.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-foreground">
          {data.name}
        </span>
        <span className="text-xs text-muted-foreground">{data.email}</span>
        <span className="text-xs text-muted-foreground">
          +91 {data.phoneNumber}
        </span>
      </div>
    </div>
  );
}
