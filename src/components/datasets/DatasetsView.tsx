"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DatasetFilters } from "./DatasetFilters";
import { DatasetTable } from "./DatasetTable";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useDatasets } from "@/hooks/api/useDatasets";
import { useMyPermissions } from "@/hooks/api/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import type { DatasetStatus, DatasetVisibility, OwnerType } from "@/types/dataset.types";

type OwnerTypeFilter = "all" | "PLATFORM" | "SUPPLIER";
type AssignmentType = "all" | "assigned_to_me" | "unassigned";

export function DatasetsView() {
  const router = useRouter();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState<OwnerTypeFilter>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentType>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [superTypeFilter, setSuperTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<DatasetVisibility | "all">("all");
  const [fileFormatFilter, setFileFormatFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Reset page when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, ownerFilter, visibilityFilter, categoryFilter, sourceFilter]);
  
  // Fetch datasets with filters
  const { data, isLoading, error } = useDatasets({
    page,
    pageSize: limit,
    q: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
    ownerType: ownerFilter !== "all" ? ownerFilter as OwnerType : undefined,
    primaryCategoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    sourceId: sourceFilter !== "all" ? sourceFilter : undefined,
  });
  
  // Permissions
  const { data: permissionsData } = useMyPermissions();
  
  // Transform data for UI
  const datasets = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => ({
      id: item.dataset.datasetUniqueId,
      name: item.dataset.title,
      owner: item.dataset.ownerType,
      supplier: null, // TODO: Fetch supplier name from ownerId
      category: item.primaryCategory?.name || "N/A",
      source: item.source?.name || "N/A",
      status: item.dataset.status,
      assignedTo: null, // TODO: Fetch assignment from separate endpoint
      lastUpdated: new Date(item.dataset.updatedAt).toLocaleDateString(),
      createdDate: new Date(item.dataset.createdAt).toLocaleDateString(),
    }));
  }, [data]);
  
  const totalPages = useMemo(() => {
    if (!data?.pagination) return 0;
    return Math.ceil(data.pagination.total / data.pagination.pageSize);
  }, [data]);
  
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setOwnerFilter("all");
    setAssignmentFilter("all");
    setSupplierFilter("all");
    setCategoryFilter("all");
    setSourceFilter("all");
    setSuperTypeFilter("all");
    setVisibilityFilter("all");
    setFileFormatFilter("all");
    setPage(1);
  }, []);

  const showSupplierColumn = ownerFilter !== "PLATFORM";

  const handleRowClick = useCallback((datasetId: string) => {
    router.push(`/dashboard/datasets/${datasetId}`);
  }, [router]);
  
  // Extract unique values for dropdowns (mock for now)
  const supplierList: string[] = [];
  const categoryList: string[] = [];
  const sourceList: string[] = [];

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
          {(permissionsData?.includes('datasets:create') ?? false) && (
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
        assignmentFilter={assignmentFilter}
        setAssignmentFilter={setAssignmentFilter}
        supplierFilter={supplierFilter}
        setSupplierFilter={setSupplierFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        superTypeFilter={superTypeFilter}
        setSuperTypeFilter={setSuperTypeFilter}
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
        fileFormatFilter={fileFormatFilter}
        setFileFormatFilter={setFileFormatFilter}
        supplierList={supplierList}
        categoryList={categoryList}
        sourceList={sourceList}
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
            <div className="p-8 text-center">
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                No datasets found
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {debouncedSearch || statusFilter !== "all" || ownerFilter !== "all" || visibilityFilter !== "all" || categoryFilter !== "all" || sourceFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first dataset"}
              </p>
              {(debouncedSearch || statusFilter !== "all" || ownerFilter !== "all" || visibilityFilter !== "all" || categoryFilter !== "all" || sourceFilter !== "all") && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <DatasetTable
              datasets={datasets}
              showSupplierColumn={showSupplierColumn}
              onRowClick={handleRowClick}
            />
          )}
        </div>

        {/* Pagination */}
        {!isLoading && datasets.length > 0 && data?.pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} datasets
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
