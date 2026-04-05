"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DatasetFilters } from "./DatasetFilters";
import { DatasetTable } from "./DatasetTable";
import { DatasetPagination } from "./DatasetPagination";
import { DatasetEmptyState } from "./DatasetEmptyState";
import { useDatasetFilters } from "./useDatasetFilters";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useDatasets, useUpdateDataset, datasetsKeys } from "@/hooks/api/useDatasets";
import { useMyPermissions } from "@/hooks/api/useAuth";

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
    ownerFilter,
    setOwnerFilter,
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

  const { data, isLoading, error } = useDatasets(filters);

  const { data: permissionsData } = useMyPermissions();

  const datasets = data?.items ?? [];

  const totalPages = useMemo(() => {
    if (!data?.pagination) return 0;
    return Math.ceil(data.pagination.total / data.pagination.pageSize);
  }, [data]);

  const showOwnerColumn = ownerFilter === "all";

  const updateDatasetMutation = useUpdateDataset();

  const handleVisibilityChange = useCallback(
    async (datasetId: string, visibility: "PUBLIC" | "PRIVATE" | "UNLISTED") => {
      await updateDatasetMutation.mutateAsync({ datasetId, data: { visibility } });
    },
    [updateDatasetMutation]
  );

  const handleRowClick = useCallback((datasetId: string) => {
    const dataset = datasets.find((item) => item.dataset.id === datasetId);
    if (dataset?.dataset.ownerType === "PLATFORM") {
      router.push(`/dashboard/platform-datasets/${datasetId}`);
    } else {
      router.push(`/dashboard/datasets/${datasetId}`);
    }
  }, [router, datasets]);

  const handleCreateClick = useCallback(() => {
    router.push("/dashboard/datasets/new");
  }, [router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Datasets</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Review, verify, and manage marketplace datasets
            </p>
          </div>
          {(permissionsData?.includes('CREATE_PLATFORM_DATASET') ?? false) && (
            <Button
              onClick={handleCreateClick}
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
            >
              Create Dataset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <DatasetFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        ownerFilter={ownerFilter}
        setOwnerFilter={setOwnerFilter}
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
      <div className="p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Failed to load datasets</p>
            </div>
          ) : datasets.length === 0 ? (
            <DatasetEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearAllFilters} />
          ) : (
            <DatasetTable
              datasets={datasets}
              showOwnerColumn={showOwnerColumn}
              onRowClick={handleRowClick}
              onVisibilityChange={handleVisibilityChange}
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
