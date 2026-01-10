"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";
import { formatStatusLabel } from "@/components/shared/StatusBadge";
import type { DatasetStatus, DatasetVisibility } from "@/types/dataset.types";

type OwnerTypeFilter = "all" | "PLATFORM" | "SUPPLIER";
type AssignmentType = "all" | "assigned_to_me" | "unassigned";

interface DatasetFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: DatasetStatus | "all";
  setStatusFilter: (value: DatasetStatus | "all") => void;
  ownerFilter: OwnerTypeFilter;
  setOwnerFilter: (value: OwnerTypeFilter) => void;
  assignmentFilter: AssignmentType;
  setAssignmentFilter: (value: AssignmentType) => void;
  supplierFilter: string;
  setSupplierFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  superTypeFilter: string;
  setSuperTypeFilter: (value: string) => void;
  visibilityFilter: DatasetVisibility | "all";
  setVisibilityFilter: (value: DatasetVisibility | "all") => void;
  fileFormatFilter: string;
  setFileFormatFilter: (value: string) => void;
  supplierList: string[];
  categoryList: string[];
  sourceList: string[];
  clearAllFilters: () => void;
}

export function DatasetFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  ownerFilter,
  setOwnerFilter,
  assignmentFilter,
  setAssignmentFilter,
  supplierFilter,
  setSupplierFilter,
  categoryFilter,
  setCategoryFilter,
  sourceFilter,
  setSourceFilter,
  superTypeFilter,
  setSuperTypeFilter,
  visibilityFilter,
  setVisibilityFilter,
  fileFormatFilter,
  setFileFormatFilter,
  supplierList,
  categoryList,
  sourceList,
  clearAllFilters,
}: DatasetFiltersProps) {
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
      id: "assignment",
      type: "toggle",
      label: "Assignment",
      value: assignmentFilter,
      onChange: (value) => setAssignmentFilter(value as AssignmentType),
      options: [
        { value: "all", label: "All" },
        { value: "assigned_to_me", label: "Assigned to me" },
        { value: "unassigned", label: "Unassigned" },
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
        { value: "ARCHIVED", label: "Archived" },
      ],
    },
    {
      id: "supplier",
      type: "select",
      label: "Supplier",
      value: supplierFilter,
      onChange: (value) => setSupplierFilter(value as string),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All Suppliers" },
        ...supplierList.map((s) => ({ value: s, label: s })),
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
        ...categoryList.map((c) => ({ value: c, label: c })),
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
        ...sourceList.map((s) => ({ value: s, label: s })),
      ],
    },
    {
      id: "superType",
      type: "select",
      label: "Dataset Super Type",
      value: superTypeFilter,
      onChange: (value) => setSuperTypeFilter(value as string),
      width: "w-[200px]",
      showInPrimary: false,
      options: [
        { value: "all", label: "All Types" },
        { value: "transactional", label: "Transactional Data" },
        { value: "reference", label: "Reference Data" },
        { value: "analytics", label: "Analytics Data" },
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
    {
      id: "fileFormat",
      type: "select",
      label: "File Format",
      value: fileFormatFilter,
      onChange: (value) => setFileFormatFilter(value as string),
      width: "w-[180px]",
      showInPrimary: false,
      options: [
        { value: "all", label: "All Formats" },
        { value: "csv", label: "CSV" },
        { value: "json", label: "JSON" },
        { value: "parquet", label: "Parquet" },
      ],
    },
  ];

  const activeFilters: ActiveFilter[] = [];

  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${formatStatusLabel(statusFilter)}`,
      onRemove: () => setStatusFilter("all"),
    });
  }

  if (ownerFilter !== "all") {
    activeFilters.push({
      key: "owner",
      label: `Owner: ${ownerFilter.charAt(0).toUpperCase() + ownerFilter.slice(1)}`,
      onRemove: () => setOwnerFilter("all"),
    });
  }

  if (assignmentFilter !== "all") {
    activeFilters.push({
      key: "assignment",
      label: assignmentFilter === "assigned_to_me" ? "Assigned to Me" : "Unassigned",
      onRemove: () => setAssignmentFilter("all"),
    });
  }

  if (supplierFilter !== "all") {
    activeFilters.push({
      key: "supplier",
      label: `Supplier: ${supplierFilter}`,
      onRemove: () => setSupplierFilter("all"),
    });
  }

  if (categoryFilter !== "all") {
    activeFilters.push({
      key: "category",
      label: `Category: ${categoryFilter}`,
      onRemove: () => setCategoryFilter("all"),
    });
  }

  if (sourceFilter !== "all") {
    activeFilters.push({
      key: "source",
      label: `Source: ${sourceFilter}`,
      onRemove: () => setSourceFilter("all"),
    });
  }

  if (superTypeFilter !== "all") {
    activeFilters.push({
      key: "superType",
      label: `Type: ${superTypeFilter}`,
      onRemove: () => setSuperTypeFilter("all"),
    });
  }

  if (visibilityFilter !== "all") {
    activeFilters.push({
      key: "visibility",
      label: `Visibility: ${visibilityFilter}`,
      onRemove: () => setVisibilityFilter("all"),
    });
  }

  if (fileFormatFilter !== "all") {
    activeFilters.push({
      key: "fileFormat",
      label: `Format: ${fileFormatFilter}`,
      onRemove: () => setFileFormatFilter("all"),
    });
  }

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={clearAllFilters}
      showAdvancedFilters={true}
    />
  );
}
