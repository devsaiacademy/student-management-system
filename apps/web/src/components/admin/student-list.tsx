"use client";

import { Button } from "@student-management-system/ui/components/button";
import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { cn } from "@student-management-system/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

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

const ITEMS_PER_PAGE = 5;

type StudentListProps = {
  students: Student[];
};

export function StudentList({ students }: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  function getPageNumbers() {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1, 2, 3);
    if (safeCurrentPage > 4) pages.push("...");

    const start = Math.max(4, safeCurrentPage - 1);
    const end = Math.min(totalPages - 2, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (safeCurrentPage < totalPages - 3) pages.push("...");
    if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
    if (!pages.includes(totalPages)) pages.push(totalPages);

    return pages;
  }

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        onSourceChange={(value) => setSourceFilter(value ?? "all")}
        onStatusChange={(value) => {
          setStatusFilter(value ?? "all");
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        sourceFilter={sourceFilter}
        statusFilter={statusFilter}
      />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 px-6 py-6">
          {paginatedStudents.length > 0 ? (
            paginatedStudents.map((student, index) => (
              <StudentCard key={student.id} index={index} student={student} />
            ))
          ) : (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No students found.
            </div>
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 border-t border-border px-6 py-4">
          <Button
            className="gap-1"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1 px-2">
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-sm text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md text-sm font-medium transition-all duration-200",
                    safeCurrentPage === page
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setCurrentPage(page)}
                  type="button"
                >
                  {page}
                </button>
              )
            )}
          </div>

          <Button
            className="gap-1"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            size="sm"
            variant="ghost"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
