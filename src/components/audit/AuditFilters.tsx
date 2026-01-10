"use client";

import { Search, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditFiltersProps<T extends string> {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter: T;
  setStatusFilter: (value: T) => void;
  statusOptions: Array<{ value: T; label: string }>;
  statusLabel?: string;
  dateRange: { from?: string; to?: string };
  setDateRange: (range: { from?: string; to?: string }) => void;
  onClearAll: () => void;
}

export function AuditFilters<T extends string>({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Search...",
  statusFilter,
  setStatusFilter,
  statusOptions,
  statusLabel = "Status",
  dateRange,
  setDateRange,
  onClearAll,
}: AuditFiltersProps<T>) {
  const hasActiveFilters =
    searchQuery || statusFilter !== ("ALL" as T) || dateRange.from || dateRange.to;

  return (
    <div
      className="p-4 rounded-lg border space-y-4"
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Event Type Filter */}
        <div className="w-full lg:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <SelectValue placeholder={statusLabel} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex gap-2 flex-1 lg:flex-initial">
          <div className="relative flex-1 lg:w-40">
            <Calendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <Input
              type="date"
              placeholder="From"
              value={dateRange.from || ""}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="pl-9"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="relative flex-1 lg:w-40">
            <Calendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <Input
              type="date"
              placeholder="To"
              value={dateRange.to || ""}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="pl-9"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearAll} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
