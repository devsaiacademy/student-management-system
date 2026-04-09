"use client";

import {
  STUDENT_SOURCES,
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
    <header className="grid h-[73px] grid-cols-3 items-center gap-4 border-b border-border bg-background px-6 py-4">
      <div />

      <div className="relative mx-auto w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 rounded-[8px] pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or roll number"
          type="search"
          value={searchQuery}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Select onValueChange={onStatusChange} value={statusFilter}>
          <SelectTrigger className="h-10 w-[150px] justify-between rounded-[8px] px-3 text-sm">
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
          <SelectTrigger className="h-10 w-[150px] justify-between rounded-[8px] px-3 text-sm">
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
            {STUDENT_SOURCES.map((source) => (
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
