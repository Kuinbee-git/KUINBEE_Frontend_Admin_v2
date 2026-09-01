'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useDatasetUpdateRequests, usePickUpdateRequest } from '@/hooks/api/useDatasets';
import { useReviewQueueFilters } from '@/hooks/useReviewQueueFilters';
import { useAuthorization } from '@/hooks/useAuthorization';
import { DATASET_REVIEW_ACCESS } from '@/lib/authorization/route-access';
import { UpdateRequestFilters } from './UpdateRequestFilters';
import { UpdateRequestTable } from './UpdateRequestTable';

export function UpdateRequestsView() {
  const router = useRouter();

  const {
    searchQuery,
    debouncedSearch,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    verificationFilter,
    setVerificationFilter,
    assignmentFilter,
    setAssignmentFilter,
    page,
    setPage,
    clearAllFilters,
  } = useReviewQueueFilters();
  const limit = 10;

  const { data, isLoading, error, refetch } = useDatasetUpdateRequests({
    page,
    pageSize: limit,
    q: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    verificationStatus: verificationFilter !== 'all' ? verificationFilter : undefined,
    assignedTo: assignmentFilter !== 'all' ? assignmentFilter : undefined,
  });

  const pickUpdateRequestMutation = usePickUpdateRequest();

  const { can } = useAuthorization();
  const canPickProposal = can(DATASET_REVIEW_ACCESS);

  const proposals = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => ({
      id: item.dataset.id,
      datasetUniqueId: item.dataset.datasetUniqueId,
      title: item.dataset.title,
      supplierName: item.supplier?.name || 'Supplier unavailable',
      supplierEmail: item.supplier?.email || null,
      category: item.primaryCategory?.name || 'Uncategorised',
      status: item.dataset.status,
      verificationStatus: item.verification?.status || 'PENDING',
      assignedTo: item.activeAssignment?.adminId || null,
      submittedAt: new Date(
        item.verification?.submittedAt || item.dataset.createdAt
      ).toLocaleDateString(),
    }));
  }, [data]);

  const totalPages = useMemo(() => {
    if (!data?.pagination) return 0;
    return Math.ceil(data.pagination.total / data.pagination.pageSize);
  }, [data]);

  const handleRowClick = useCallback(
    (datasetId: string) => {
      router.push(`/dashboard/update-requests/${datasetId}`);
    },
    [router]
  );

  const handlePickProposal = useCallback(
    async (datasetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await pickUpdateRequestMutation.mutateAsync(datasetId);
        refetch();
      } catch {
        // The mutation hook displays the backend error.
      }
    },
    [pickUpdateRequestMutation, refetch]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Dataset Update Requests
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Review and manage supplier update submissions
            </p>
          </div>
        </div>
      </div>

      <UpdateRequestFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        verificationFilter={verificationFilter}
        setVerificationFilter={setVerificationFilter}
        assignmentFilter={assignmentFilter}
        setAssignmentFilter={setAssignmentFilter}
        clearAllFilters={clearAllFilters}
      />

      <div className="p-4 sm:p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">Failed to load update requests</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : proposals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No update requests found
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {debouncedSearch ||
                statusFilter !== 'all' ||
                verificationFilter !== 'all' ||
                assignmentFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No supplier update requests pending review'}
              </p>
              {(debouncedSearch ||
                statusFilter !== 'all' ||
                verificationFilter !== 'all' ||
                assignmentFilter !== 'all') && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <UpdateRequestTable
              proposals={proposals}
              onRowClick={handleRowClick}
              onPickProposal={canPickProposal ? handlePickProposal : undefined}
              pickingDatasetId={
                pickUpdateRequestMutation.isPending
                  ? pickUpdateRequestMutation.variables
                  : undefined
              }
            />
          )}
        </div>

        {!isLoading && proposals.length > 0 && data?.pagination && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of{' '}
              {data.pagination.total} update requests
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
