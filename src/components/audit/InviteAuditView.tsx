'use client';

import { useState, useMemo } from 'react';
import { InviteAuditTable } from './InviteAuditTable';
import { AuditFilters } from './AuditFilters';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useInviteAudit } from '@/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import type { InviteAuditEventType } from '@/types';

export function InviteAuditView() {
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<InviteAuditEventType | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Build API params
  const params = useMemo(
    () => ({
      page,
      pageSize: limit,
      q: debouncedSearch || undefined,
      eventType: eventTypeFilter !== 'ALL' ? eventTypeFilter : undefined,
      from: dateRange.from,
      to: dateRange.to,
      sort: 'createdAt:desc' as const,
    }),
    [page, limit, debouncedSearch, eventTypeFilter, dateRange]
  );

  // Fetch audit logs
  const { data, isLoading, isError, refetch } = useInviteAudit(params);
  const logs = data?.items || [];
  const totalPages = data?.pagination
    ? Math.ceil(data.pagination.total / data.pagination.pageSize)
    : 0;

  const handleClearFilters = () => {
    setSearchQuery('');
    setEventTypeFilter('ALL');
    setDateRange({});
    setPage(1);
  };

  const eventTypes: Array<{ value: InviteAuditEventType | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'All Events' },
    { value: 'CREATED', label: 'Created' },
    { value: 'RESENT', label: 'Resent' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'USED', label: 'Used' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AuditFilters
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        searchPlaceholder="Search by invite email..."
        statusFilter={eventTypeFilter}
        setStatusFilter={(value) => {
          setEventTypeFilter(value);
          setPage(1);
        }}
        statusOptions={eventTypes}
        statusLabel="Event Type"
        dateRange={dateRange}
        setDateRange={(value) => {
          setDateRange(value);
          setPage(1);
        }}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        {isLoading ? (
          <TableSkeleton columns={5} rows={10} />
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-[var(--status-error)]">
              Failed to load audit logs. Please try again.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No audit logs found
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {debouncedSearch || eventTypeFilter !== 'ALL' || dateRange.from || dateRange.to
                ? 'Try adjusting your filters'
                : 'No invite activity recorded yet'}
            </p>
            {(debouncedSearch || eventTypeFilter !== 'ALL' || dateRange.from || dateRange.to) && (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <InviteAuditTable logs={logs} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
