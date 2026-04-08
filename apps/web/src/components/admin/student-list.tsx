"use client";

import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { Skeleton } from "@student-management-system/ui/components/skeleton";
import { useMemo, useState } from "react";

import { AdminHeader } from "./admin-header";
import { StudentCard } from "./student-card";

type Student = {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  studentStatus: string;
  studentSource: string;
};

type StudentListProps = {
  students: Student[];
  isLoading?: boolean;
};

const SKELETON_COUNT = 5;

function StudentCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-border bg-background px-5 py-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="size-4 shrink-0 rounded" />
    </div>
  );
}

export function StudentList({ students, isLoading = false }: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.studentStatus === statusFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((s) => s.studentSource === sourceFilter);
    }

    return result;
  }, [students, searchQuery, statusFilter, sourceFilter]);

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
          {filteredStudents.length > 0 ? (
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
    </div>
  );
}
