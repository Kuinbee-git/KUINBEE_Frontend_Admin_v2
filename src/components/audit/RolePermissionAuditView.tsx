"use client";

import { useState, useMemo, useEffect } from "react";
import { RolePermissionAuditTable } from "./RolePermissionAuditTable";
import { AuditFilters } from "./AuditFilters";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useRolePermissionAudit } from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import type { RolePermissionAuditEventType } from "@/types";

export function RolePermissionAuditView() {
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<RolePermissionAuditEventType | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, eventTypeFilter, dateRange]);

  // Build API params
  const params = useMemo(
    () => ({
      page,
      pageSize: limit,
      roleId: debouncedSearch || undefined,
      eventType: eventTypeFilter !== "ALL" ? eventTypeFilter : undefined,
      from: dateRange.from,
      to: dateRange.to,
      sort: "createdAt:desc" as const,
    }),
    [page, limit, debouncedSearch, eventTypeFilter, dateRange]
  );

  // Fetch audit logs
  const { data, isLoading, isError } = useRolePermissionAudit(params);
  const logs = data?.items || [];
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / data.pagination.pageSize) : 0;

  const handleClearFilters = () => {
    setSearchQuery("");
    setEventTypeFilter("ALL");
    setDateRange({});
    setPage(1);
  };

  const eventTypes: Array<{ value: RolePermissionAuditEventType | "ALL"; label: string }> = [
    { value: "ALL", label: "All Events" },
    { value: "ADDED", label: "Added" },
    { value: "REMOVED", label: "Removed" },
    { value: "REPLACED", label: "Replaced" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AuditFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Search by role ID..."
        statusFilter={eventTypeFilter}
        setStatusFilter={setEventTypeFilter}
        statusOptions={eventTypes}
        statusLabel="Event Type"
        dateRange={dateRange}
        setDateRange={setDateRange}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        {isLoading ? (
          <TableSkeleton columns={6} rows={10} />
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load audit logs. Please try again.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              No audit logs found
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {debouncedSearch || eventTypeFilter !== "ALL" || dateRange.from || dateRange.to
                ? "Try adjusting your filters"
                : "No permission change activity recorded yet"}
            </p>
            {(debouncedSearch || eventTypeFilter !== "ALL" || dateRange.from || dateRange.to) && (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <RolePermissionAuditTable logs={logs} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
