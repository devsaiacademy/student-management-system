"use client";

import { Button } from "@student-management-system/ui/components/button";
import { cn } from "@student-management-system/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1, 2, 3);
  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(4, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (currentPage < totalPages - 3) {
    pages.push("...");
  }
  if (!pages.includes(totalPages - 1)) {
    pages.push(totalPages - 1);
  }
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pageNumbers = getPageNumbers(safeCurrentPage, safeTotalPages);

  return (
    <div className="flex items-center justify-center gap-1 px-6 py-4">
      <Button
        className="gap-1"
        disabled={safeCurrentPage === 1}
        onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
        size="sm"
        variant="ghost"
      >
        <ChevronLeft className="size-4" />
        Previous
      </Button>

      <div className="flex items-center gap-1 px-2">
        {pageNumbers.map((page, i) =>
          page === "..." ? (
            <span
              className="px-2 text-sm text-muted-foreground"
              key={`ellipsis-${i}`}
            >
              ...
            </span>
          ) : (
            <button
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-sm font-medium transition-all duration-200",
                safeCurrentPage === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          )
        )}
      </div>

      <Button
        className="gap-1"
        disabled={safeCurrentPage === safeTotalPages}
        onClick={() =>
          onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))
        }
        size="sm"
        variant="ghost"
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
