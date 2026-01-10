"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";

interface SourceFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  verificationFilter: string;
  setVerificationFilter: (value: string) => void;
  createdByTypeFilter: string;
  setCreatedByTypeFilter: (value: string) => void;
  activeFilters: ActiveFilter[];
  clearAllFilters: () => void;
}

export function SourceFilters({
  searchQuery,
  setSearchQuery,
  verificationFilter,
  setVerificationFilter,
  createdByTypeFilter,
  setCreatedByTypeFilter,
  activeFilters,
  clearAllFilters,
}: SourceFiltersProps) {
  const filters: FilterConfig<unknown>[] = [
    {
      id: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by source name...",
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: "verification",
      type: "select",
      label: "Verification Status",
      value: verificationFilter,
      onChange: (value) => setVerificationFilter(value as string),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All" },
        { value: "verified", label: "Verified" },
        { value: "unverified", label: "Unverified" },
      ],
    },
    {
      id: "createdByType",
      type: "select",
      label: "Created By Type",
      value: createdByTypeFilter,
      onChange: (value) => setCreatedByTypeFilter(value as string),
      width: "w-[180px]",
      options: [
        { value: "all", label: "All" },
        { value: "platform", label: "Platform" },
        { value: "supplier", label: "Supplier" },
      ],
    },
  ];

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={clearAllFilters}
    />
  );
}
