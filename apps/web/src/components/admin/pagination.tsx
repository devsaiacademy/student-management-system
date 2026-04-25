"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@student-management-system/ui/components/pagination";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type MouseEvent, useCallback, useMemo } from "react";

import { LIMIT } from "@/utils/constant";
import { trpc } from "@/utils/trpc";

// How many numbered items to show at most (excluding prev/next/ellipsis)
const VISIBLE_SIBLINGS = 3;

type PageToken = number | "ellipsis-start" | "ellipsis-end";

function buildPageList(current: number, total: number): PageToken[] {
  if (total <= 1) {
    return [1];
  }

  const pages = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= VISIBLE_SIBLINGS; offset++) {
    if (current - offset >= 1) {
      pages.add(current - offset);
    }
    if (current + offset <= total) {
      pages.add(current + offset);
    }
  }

  const ordered = Array.from(pages).sort((a, b) => a - b);
  const result: PageToken[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const pageNumber = ordered[i];
    if (pageNumber === undefined) {
      continue;
    }
    const previous = ordered[i - 1];
    if (previous !== undefined && pageNumber - previous > 1) {
      result.push(previous === 1 ? "ellipsis-start" : "ellipsis-end");
    }
    result.push(pageNumber);
  }

  return result;
}

export function AdminPagination() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = useMemo(() => {
    const raw = Number(searchParams.get("page"));
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  const { data } = useQuery(trpc.students.getCount.queryOptions());
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const buildHref = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const goTo = useCallback(
    (page: number) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (page < 1 || page > totalPages || page === currentPage) {
        return;
      }
      router.push(buildHref(page) as Route);
    },
    [buildHref, currentPage, router, totalPages]
  );

  const pageTokens = useMemo(
    () => buildPageList(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const rangeEnd = Math.min(currentPage * LIMIT, totalCount);

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <footer className="flex min-h-[68px] shrink-0 items-center border-t border-border bg-background px-6 py-4">
      {/* Left spacer */}
      <div className="flex-1" />

      {/* Center pagination */}
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                aria-disabled={isFirst}
                className={
                  isFirst ? "pointer-events-none opacity-50" : undefined
                }
                href={buildHref(Math.max(1, currentPage - 1))}
                onClick={goTo(currentPage - 1)}
              />
            </PaginationItem>

            {pageTokens.map((token) => {
              if (token === "ellipsis-start" || token === "ellipsis-end") {
                return (
                  <PaginationItem key={token}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={token}>
                  <PaginationLink
                    href={buildHref(token)}
                    isActive={token === currentPage}
                    onClick={goTo(token)}
                  >
                    {token}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                aria-disabled={isLast}
                className={
                  isLast ? "pointer-events-none opacity-50" : undefined
                }
                href={buildHref(Math.min(totalPages, currentPage + 1))}
                onClick={goTo(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Right "Showing" caption */}
      <div className="flex flex-1 justify-end">
        <p className="hidden text-sm text-muted-foreground sm:block">
          Showing{" "}
          <span className="font-medium text-foreground">
            {rangeStart}-{rangeEnd}
          </span>{" "}
          of <span className="font-medium text-foreground">{totalCount}</span>
        </p>
      </div>
    </footer>
  );
}
