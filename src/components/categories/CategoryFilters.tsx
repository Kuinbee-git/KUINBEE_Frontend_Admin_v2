"use client";

import { FilterBar, FilterConfig, ActiveFilter } from "@/components/shared/FilterBar";

interface CategoryFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  usageFilter: string;
  setUsageFilter: (value: string) => void;
  clearAllFilters: () => void;
}

export function CategoryFilters({
  searchQuery,
  setSearchQuery,
  usageFilter,
  setUsageFilter,
  clearAllFilters,
}: CategoryFiltersProps) {
  const filters: FilterConfig<unknown>[] = [
    {
      id: "search",
      type: "search",
      label: "Search",
      placeholder: "Search by category name...",
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: "usage",
      type: "select",
      label: "Usage",
      value: usageFilter,
      onChange: (value) => setUsageFilter(value as string),
      width: "w-[140px]",
      options: [
        { value: "all", label: "All" },
        { value: "used", label: "Used" },
        { value: "unused", label: "Unused" },
      ],
    },
  ];

  const activeFilters: ActiveFilter[] = [];

  if (usageFilter !== "all") {
    activeFilters.push({
      key: "usage",
      label: `Usage: ${usageFilter === "used" ? "Used" : "Unused"}`,
      onRemove: () => setUsageFilter("all"),
    });
  }

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={clearAllFilters}
    />
  );
}
