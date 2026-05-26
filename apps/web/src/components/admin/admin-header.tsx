"use client";

import {
  REACHED_US_BY_OPTIONS,
  STUDENT_STATUSES,
} from "@student-management-system/db/schema/constants";
import { Input } from "@student-management-system/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { Search } from "lucide-react";

const STATUS_LABELS: Record<(typeof STUDENT_STATUSES)[number], string> = {
  pending: "Pending",
  active: "Active",
  in_active: "Inactive",
  discontinue: "Discontinued",
};

type AdminHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string | null) => void;
  sourceFilter: string;
  onSourceChange: (value: string | null) => void;
};

export function AdminHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourceFilter,
  onSourceChange,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border bg-background px-4 py-3 pr-14 md:grid md:h-[73px] md:grid-cols-3 md:items-center md:gap-4 md:px-6 md:py-4 md:pr-6">
      <div className="hidden md:block" />

      <div className="relative w-full md:mx-auto md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 rounded-[8px] pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or roll number"
          type="search"
          value={searchQuery}
        />
      </div>

      <div className="flex items-center gap-2 md:justify-end md:gap-3">
        <Select onValueChange={onStatusChange} value={statusFilter}>
          <SelectTrigger className="h-10 w-full flex-1 justify-between rounded-[8px] px-3 text-sm md:w-[150px] md:flex-none">
            <SelectValue>
              {(value) =>
                !value || value === "all"
                  ? "All Status"
                  : (STATUS_LABELS[
                      value as (typeof STUDENT_STATUSES)[number]
                    ] ?? "All Status")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className="rounded-[6px]"
            sideOffset={6}
          >
            <SelectItem value="all">All Status</SelectItem>
            {STUDENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={onSourceChange} value={sourceFilter}>
          <SelectTrigger className="h-10 w-full flex-1 justify-between rounded-[8px] px-3 text-sm md:w-[150px] md:flex-none">
            <SelectValue>
              {(value) =>
                !value || value === "all" ? "All Sources" : String(value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className="rounded-[6px]"
            sideOffset={6}
          >
            <SelectItem value="all">All Sources</SelectItem>
            {REACHED_US_BY_OPTIONS.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
