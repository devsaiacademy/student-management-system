"use client";

import {
  STUDENT_SOURCES,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";
import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

import { AdminHeader } from "./admin-header";
import { AdminPagination } from "./pagination";
import { StudentCard } from "./student-card";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

function StudentCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-border bg-background px-4 py-4 sm:items-center sm:gap-4 sm:px-5">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-40 max-w-full rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

type Student = {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  studentStatus: string;
  studentSource: string;
};

type StudentStatus = (typeof STUDENT_STATUSES)[number];
type StudentSource = (typeof STUDENT_SOURCES)[number];

type StudentListProps = {
  students: Student[];
  isLoading?: boolean;
};

export function StudentList({ students, isLoading = false }: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const isStatusFiltered = statusFilter !== "all";
  const isSourceFiltered = sourceFilter !== "all";
  const isFiltering =
    isStatusFiltered || isSourceFiltered || searchQuery.length > 0;

  const statusQuery = useQuery(
    trpc.students.filterStudentsWithStatus.queryOptions(
      { status: isStatusFiltered ? (statusFilter as StudentStatus) : null },
      { enabled: isStatusFiltered }
    )
  );

  const sourceQuery = useQuery(
    trpc.students.filterStudentsWithSource.queryOptions(
      { source: isSourceFiltered ? (sourceFilter as StudentSource) : null },
      { enabled: isSourceFiltered }
    )
  );

  const searchResults = useQuery(
    trpc.students.searchStudents.queryOptions(
      {
        search: searchQuery || null,
        status: isStatusFiltered ? (statusFilter as StudentStatus) : null,
        source: isSourceFiltered ? (sourceFilter as StudentSource) : null,
      },
      {
        enabled: searchQuery.length > 0 || isSourceFiltered || isStatusFiltered,
      }
    )
  );

  const baseList: Student[] = useMemo(() => {
    if (isStatusFiltered && isSourceFiltered) {
      const sourceIds = new Set((sourceQuery.data ?? []).map((s) => s.id));
      return (statusQuery.data ?? []).filter((s) => sourceIds.has(s.id));
    }
    if (isStatusFiltered) {
      return statusQuery.data ?? [];
    }
    if (isSourceFiltered) {
      return sourceQuery.data ?? [];
    }
    return students;
  }, [
    isStatusFiltered,
    isSourceFiltered,
    statusQuery.data,
    sourceQuery.data,
    students,
  ]);

  const filteredStudents: Student[] = useMemo(() => {
    if (searchQuery) {
      return searchResults.data ?? [];
    }
    return baseList;
  }, [baseList, searchQuery, searchResults.data]);

  const isSearchLoading = searchQuery.length > 0 && searchResults.isFetching;
  const isStatusLoading = isStatusFiltered && statusQuery.isFetching;
  const isSourceLoading = isSourceFiltered && sourceQuery.isFetching;
  const isQueryLoading =
    isLoading || isSearchLoading || isStatusLoading || isSourceLoading;

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        onSearchChange={setSearchQuery}
        onSourceChange={(value) => setSourceFilter(value ?? "all")}
        onStatusChange={(value) => setStatusFilter(value ?? "all")}
        searchQuery={searchQuery}
        sourceFilter={sourceFilter}
        statusFilter={statusFilter}
      />

      <ScrollArea className="max-h-[85vh] flex-1">
        <div className="flex flex-col gap-3 px-6 py-6">
          {isQueryLoading ? (
            SKELETON_KEYS.map((key) => <StudentCardSkeleton key={key} />)
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <StudentCard index={index} key={student.id} student={student} />
            ))
          ) : (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No students found.
            </div>
          )}
        </div>
      </ScrollArea>

      {isFiltering ? null : <AdminPagination />}
    </div>
  );
}
