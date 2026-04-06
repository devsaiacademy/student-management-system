"use client";

import { Input } from "@student-management-system/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { Search } from "lucide-react";

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
    <header className="flex items-center gap-4 border-b border-border bg-background px-6 py-4">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or roll number"
          type="search"
          value={searchQuery}
        />
      </div>

      <div className="flex items-center gap-3">
        <Select onValueChange={onStatusChange} value={statusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="in_active">Inactive</SelectItem>
            <SelectItem value="discontinue">Discontinued</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={onSourceChange} value={sourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
