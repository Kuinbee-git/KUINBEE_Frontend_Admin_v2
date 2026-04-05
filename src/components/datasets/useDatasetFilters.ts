"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatStatusLabel } from "@/components/shared/StatusBadge";
import type { DatasetListParams } from "@/services/datasets.service";
import type { DatasetStatus, DatasetVisibility, OwnerType } from "@/types/dataset.types";
import { useDebounce } from "@/hooks/useDebounce";

export type OwnerTypeFilter = "all" | OwnerType;

export function useDatasetFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | "all">("PUBLISHED");
  const [ownerFilter, setOwnerFilter] = useState<OwnerTypeFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<DatasetVisibility | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, ownerFilter, visibilityFilter, categoryFilter, sourceFilter]);

  const filters: DatasetListParams = useMemo(() => ({
    page,
    pageSize,
    q: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
    ownerType: ownerFilter !== "all" ? ownerFilter : undefined,
    primaryCategoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    sourceId: sourceFilter !== "all" ? sourceFilter : undefined,
  }), [page, pageSize, debouncedSearch, statusFilter, visibilityFilter, ownerFilter, categoryFilter, sourceFilter]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("PUBLISHED");
    setOwnerFilter("all");
    setVisibilityFilter("all");
    setCategoryFilter("all");
    setSourceFilter("all");
    setPage(1);
  }, []);

  const activeFilters = useMemo(() => {
    const values: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (statusFilter !== "all") {
      values.push({ key: "status", label: `Status: ${formatStatusLabel(statusFilter)}`, onRemove: () => setStatusFilter("all") });
    }

    if (ownerFilter !== "all") {
      values.push({
        key: "owner",
        label: `Owner: ${ownerFilter === "PLATFORM" ? "Platform" : "Supplier"}`,
        onRemove: () => setOwnerFilter("all"),
      });
    }

    if (visibilityFilter !== "all") {
      values.push({ key: "visibility", label: `Visibility: ${visibilityFilter}`, onRemove: () => setVisibilityFilter("all") });
    }

    if (categoryFilter !== "all") {
      values.push({ key: "category", label: `Category`, onRemove: () => setCategoryFilter("all") });
    }

    if (sourceFilter !== "all") {
      values.push({ key: "source", label: `Source`, onRemove: () => setSourceFilter("all") });
    }

    return values;
  }, [statusFilter, ownerFilter, visibilityFilter, categoryFilter, sourceFilter]);

  const hasActiveFilters = activeFilters.length > 0 || !!debouncedSearch;

  return {
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
  };
}
