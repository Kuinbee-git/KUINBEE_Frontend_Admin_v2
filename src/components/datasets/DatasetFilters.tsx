"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";
import { useCategories } from "@/hooks/api/useCategories";
import { useSources } from "@/hooks/api/useSources";
import type { DatasetStatus, DatasetVisibility } from "@/types/dataset.types";
import type { OwnerTypeFilter } from "./useDatasetFilters";

interface DatasetFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: DatasetStatus | "all";
  setStatusFilter: (value: DatasetStatus | "all") => void;
  ownerFilter: OwnerTypeFilter;
  setOwnerFilter: (value: OwnerTypeFilter) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  visibilityFilter: DatasetVisibility | "all";
  setVisibilityFilter: (value: DatasetVisibility | "all") => void;
  activeFilters: ActiveFilter[];
  clearAllFilters: () => void;
}

export function DatasetFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  ownerFilter,
  setOwnerFilter,
  categoryFilter,
  setCategoryFilter,
  sourceFilter,
  setSourceFilter,
  visibilityFilter,
  setVisibilityFilter,
  activeFilters,
  clearAllFilters,
}: DatasetFiltersProps) {
  const { data: categoriesData } = useCategories({ pageSize: 100 });
  const { data: sourcesData } = useSources({ pageSize: 100 });

  const categoryOptions = categoriesData?.items ?? [];
  const sourceOptions = sourcesData?.items ?? [];

  const filters: FilterConfig<unknown>[] = [
    {
      id: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by name, ID, supplier, or category...",
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: "owner",
      type: "toggle",
      label: "Owner",
      value: ownerFilter,
      onChange: (value) => setOwnerFilter(value as OwnerTypeFilter),
      options: [
        { value: "all", label: "All" },
        { value: "PLATFORM", label: "Platform" },
        { value: "SUPPLIER", label: "Supplier" },
      ],
    },
    {
      id: "status",
      type: "select",
      label: "Status",
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as DatasetStatus | "all"),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "UNDER_REVIEW", label: "Under Review" },
        { value: "REJECTED", label: "Rejected" },
        { value: "VERIFIED", label: "Verified" },
        { value: "PUBLISHED", label: "Published" },
        { value: "DELISTED", label: "Delisted" },
        { value: "ARCHIVED", label: "Archived" },
      ],
    },
    {
      id: "category",
      type: "select",
      label: "Category",
      value: categoryFilter,
      onChange: (value) => setCategoryFilter(value as string),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All Categories" },
        ...categoryOptions.map((category) => ({ value: category.id, label: category.name })),
      ],
    },
    {
      id: "source",
      type: "select",
      label: "Source",
      value: sourceFilter,
      onChange: (value) => setSourceFilter(value as string),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All Sources" },
        ...sourceOptions.map((source) => ({ value: source.id, label: source.name })),
      ],
    },
    {
      id: "visibility",
      type: "select",
      label: "Visibility",
      value: visibilityFilter,
      onChange: (value) => setVisibilityFilter(value as DatasetVisibility | "all"),
      width: "w-[180px]",
      showInPrimary: false,
      options: [
        { value: "all", label: "All Visibility" },
        { value: "PUBLIC", label: "Public" },
        { value: "PRIVATE", label: "Private" },
        { value: "UNLISTED", label: "Unlisted" },
      ],
    },
  ];

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={clearAllFilters}
      showAdvancedFilters={false}
    />
  );
}
