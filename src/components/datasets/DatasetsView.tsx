'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DatasetFilters } from './DatasetFilters';
import { DatasetTable } from './DatasetTable';
import { DatasetPagination } from './DatasetPagination';
import { DatasetEmptyState } from './DatasetEmptyState';
import { useDatasetFilters } from './useDatasetFilters';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDatasets, useUpdateDataset, datasetsKeys } from '@/hooks/api/useDatasets';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';

export function DatasetsView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Clear cache on mount to refresh data with new defaults
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
  }, [queryClient]);

  const {
    page,
    pageSize,
    setPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    categoryFilter,
    setCategoryFilter,
    sourceFilter,
    setSourceFilter,
    activeFilters,
    hasActiveFilters,
    clearAllFilters,
    filters,
  } = useDatasetFilters();

  const { data, isLoading, error, refetch } = useDatasets(filters);

  const { can } = useAuthorization();
  const canCreate = can({ anyOf: [PERMISSIONS.DATASETS.CREATE_PLATFORM] });
  const canUpdate = can({ anyOf: [PERMISSIONS.DATASETS.UPDATE_PLATFORM] });

  const datasets = useMemo(() => data?.items ?? [], [data?.items]);

  const totalPages = useMemo(() => {
    if (!data?.pagination) return 0;
    return Math.ceil(data.pagination.total / data.pagination.pageSize);
  }, [data]);

  const updateDatasetMutation = useUpdateDataset();

  const handleVisibilityChange = useCallback(
    async (datasetId: string, visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED') => {
      try {
        await updateDatasetMutation.mutateAsync({ datasetId, data: { visibility } });
      } catch {
        // The mutation hook presents the error and the server value remains authoritative.
      }
    },
    [updateDatasetMutation]
  );

  const handleRowClick = useCallback(
    (datasetId: string) => {
      router.push(`/dashboard/platform-datasets/${datasetId}`);
    },
    [router]
  );

  const handleCreateClick = useCallback(() => {
    router.push('/dashboard/datasets/new');
  }, [router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader
        title="Datasets"
        description="Create and manage platform-owned marketplace datasets"
        actions={
          canCreate ? <Button onClick={handleCreateClick}>Create Dataset</Button> : undefined
        }
      />

      {/* Filter Bar */}
      <DatasetFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
        activeFilters={activeFilters}
        clearAllFilters={clearAllFilters}
      />

      {/* Dataset Table */}
      <div className="p-4 sm:p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">Failed to load datasets</p>
              <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : datasets.length === 0 ? (
            <DatasetEmptyState
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearAllFilters}
            />
          ) : (
            <DatasetTable
              datasets={datasets}
              onRowClick={handleRowClick}
              onVisibilityChange={handleVisibilityChange}
              canUpdateVisibility={canUpdate}
            />
          )}
        </div>

        {!isLoading && datasets.length > 0 && data?.pagination && (
          <DatasetPagination
            page={page}
            pageSize={pageSize}
            total={data.pagination.total}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
