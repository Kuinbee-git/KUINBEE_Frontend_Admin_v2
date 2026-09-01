'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSemanticStatusStyle, type SemanticStatus } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useAssignedDatasets } from '@/hooks';
import type { AssignedDatasetListItem, AssignmentStatus, DatasetStatus } from '@/types';

type StatusFilterType = AssignmentStatus | 'all';

const ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = [
  'ACTIVE',
  'COMPLETED',
  'REASSIGNED',
  'CANCELLED',
];

function getStatusFilter(value: string | null): StatusFilterType {
  if (value === 'all') return 'all';
  return value && ASSIGNMENT_STATUSES.includes(value as AssignmentStatus)
    ? (value as AssignmentStatus)
    : 'ACTIVE';
}

function getPage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getAssignmentStatusBadge(status: AssignmentStatus) {
  const config: Record<
    AssignmentStatus,
    { label: string; semantic: SemanticStatus; icon: typeof Clock }
  > = {
    ACTIVE: {
      label: 'Active',
      semantic: 'in_progress',
      icon: Clock,
    },
    COMPLETED: {
      label: 'Completed',
      semantic: 'success',
      icon: CheckCircle,
    },
    REASSIGNED: {
      label: 'Reassigned',
      semantic: 'warning',
      icon: RefreshCw,
    },
    CANCELLED: {
      label: 'Cancelled',
      semantic: 'neutral',
      icon: XCircle,
    },
  };

  const { label, semantic, icon: Icon } = config[status];

  return (
    <Badge variant="outline" className="gap-1" style={getSemanticStatusStyle(semantic)}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function getDatasetStatusBadge(status: DatasetStatus) {
  const config: Record<DatasetStatus, { label: string; semantic: SemanticStatus }> = {
    SUBMITTED: {
      label: 'Submitted',
      semantic: 'pending',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      semantic: 'in_progress',
    },
    VERIFIED: {
      label: 'Verified',
      semantic: 'success',
    },
    REJECTED: {
      label: 'Rejected',
      semantic: 'error',
    },
    PUBLISHED: {
      label: 'Published',
      semantic: 'success',
    },
    DELISTED: {
      label: 'Delisted',
      semantic: 'warning',
    },
    ARCHIVED: {
      label: 'Archived',
      semantic: 'neutral',
    },
  };

  const { label, semantic } = config[status] || { label: status, semantic: 'neutral' as const };

  return (
    <Badge variant="outline" style={getSemanticStatusStyle(semantic)}>
      {label}
    </Badge>
  );
}

export function AssignedDatasetsView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = getPage(searchParams.get('page'));
  const limit = 10;
  const statusFilter = getStatusFilter(searchParams.get('status'));

  const updateQuery = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      if (resetPage) next.delete('page');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setStatusFilter = useCallback(
    (value: StatusFilterType) => updateQuery({ status: value }),
    [updateQuery]
  );
  const setPage = useCallback(
    (value: number) => updateQuery({ page: value > 1 ? String(value) : null }, false),
    [updateQuery]
  );

  // Build API params
  const params = useMemo(
    () => ({
      page,
      pageSize: limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [page, limit, statusFilter]
  );

  // Fetch assigned datasets
  const { data, isLoading, isError, refetch } = useAssignedDatasets(params);
  const assignments = data?.items || [];
  const totalPages = data?.pagination
    ? Math.ceil(data.pagination.total / data.pagination.pageSize)
    : 0;

  // Handlers
  const handleRowClick = useCallback(
    (item: AssignedDatasetListItem) => {
      // Navigate to dataset detail view using the internal database ID
      router.push(`/dashboard/datasets/${item.dataset.id}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Page Header */}
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--brand-primary-light)' }}
            >
              <ClipboardList
                className="w-6 h-6"
                style={{ color: 'var(--brand-primary)' }}
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                My Queue
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Datasets assigned to you for review
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="p-4 border-b"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilterType)}
          >
            <SelectTrigger
              aria-label="Filter assignments by status"
              className="w-full sm:w-[180px]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <SelectValue placeholder="Assignment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REASSIGNED">Reassigned</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 sm:p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">
                Failed to load assignments. Please try again.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle
                aria-hidden="true"
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No assignments found
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {statusFilter !== 'all'
                  ? 'Try changing the status filter'
                  : "You don't have any datasets assigned for review"}
              </p>
              {statusFilter !== 'all' && statusFilter !== 'ACTIVE' && (
                <Button onClick={handleClearFilters} variant="outline">
                  Show Active Assignments
                </Button>
              )}
            </div>
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <TableHead style={{ color: 'var(--text-muted)' }}>Dataset</TableHead>
                  <TableHead style={{ color: 'var(--text-muted)' }}>Supplier</TableHead>
                  <TableHead style={{ color: 'var(--text-muted)' }}>Dataset Status</TableHead>
                  <TableHead style={{ color: 'var(--text-muted)' }}>Assignment Status</TableHead>
                  <TableHead style={{ color: 'var(--text-muted)' }}>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((item) => (
                  <TableRow
                    key={item.assignment.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open assigned dataset ${item.dataset.title}`}
                    className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
                    style={{ borderColor: 'var(--border-default)' }}
                    onClick={() => handleRowClick(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleRowClick(item);
                      }
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.dataset.title}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.dataset.datasetUniqueId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.supplier?.name || 'Supplier unavailable'}
                        </p>
                        {item.supplier?.email ? (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.supplier.email}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{getDatasetStatusBadge(item.dataset.status)}</TableCell>
                    <TableCell>{getAssignmentStatusBadge(item.assignment.status)}</TableCell>
                    <TableCell style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.assignment.assignedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && assignments.length > 0 && data?.pagination && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of{' '}
              {data.pagination.total} assignments
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
