'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterConfig, ActiveFilter } from '@/components/shared/FilterBar';
import { useCategories } from '@/hooks/api/useCategories';
import { useSources } from '@/hooks/api/useSources';
import type { DatasetStatus, DatasetVisibility } from '@/types/dataset.types';

interface DatasetFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: DatasetStatus | 'all';
  setStatusFilter: (value: DatasetStatus | 'all') => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  visibilityFilter: DatasetVisibility | 'all';
  setVisibilityFilter: (value: DatasetVisibility | 'all') => void;
  activeFilters: ActiveFilter[];
  clearAllFilters: () => void;
}

export function DatasetFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sourceFilter,
  setSourceFilter,
  visibilityFilter,
  setVisibilityFilter,
  activeFilters,
  clearAllFilters,
}: DatasetFiltersProps) {
  const {
    data: categoriesData,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories({ pageSize: 200, sort: 'name:asc' });
  const {
    data: sourcesData,
    isError: sourcesError,
    refetch: refetchSources,
  } = useSources({ pageSize: 200, sort: 'name:asc' });

  const categoryOptions = categoriesData?.items ?? [];
  const sourceOptions = sourcesData?.items ?? [];

  const filters: FilterConfig<unknown>[] = [
    {
      id: 'search',
      type: 'search',
      label: 'Search',
      placeholder: 'Search by title or dataset ID...',
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: 'status',
      type: 'select',
      label: 'Status',
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as DatasetStatus | 'all'),
      width: 'w-[180px]',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'UNDER_REVIEW', label: 'Under Review' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'VERIFIED', label: 'Verified' },
        { value: 'PUBLISHED', label: 'Published' },
        { value: 'DELISTED', label: 'Delisted' },
        { value: 'ARCHIVED', label: 'Archived' },
      ],
    },
    {
      id: 'category',
      type: 'select',
      label: 'Category',
      value: categoryFilter,
      onChange: (value) => setCategoryFilter(value as string),
      width: 'w-[180px]',
      options: [
        { value: 'all', label: 'All Categories' },
        ...categoryOptions.map((category) => ({ value: category.id, label: category.name })),
      ],
    },
    {
      id: 'source',
      type: 'select',
      label: 'Source',
      value: sourceFilter,
      onChange: (value) => setSourceFilter(value as string),
      width: 'w-[180px]',
      options: [
        { value: 'all', label: 'All Sources' },
        ...sourceOptions.map((source) => ({ value: source.id, label: source.name })),
      ],
    },
    {
      id: 'visibility',
      type: 'select',
      label: 'Visibility',
      value: visibilityFilter,
      onChange: (value) => setVisibilityFilter(value as DatasetVisibility | 'all'),
      width: 'w-[180px]',
      showInPrimary: false,
      options: [
        { value: 'all', label: 'All Visibility' },
        { value: 'PUBLIC', label: 'Public' },
        { value: 'PRIVATE', label: 'Private' },
        { value: 'UNLISTED', label: 'Unlisted' },
      ],
    },
  ];

  const referenceDataError = categoriesError || sourcesError;

  return (
    <div>
      <FilterBar
        filters={filters}
        activeFilters={activeFilters}
        onClearAll={clearAllFilters}
        showAdvancedFilters={false}
      />
      {referenceDataError ? (
        <div
          className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          role="alert"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            borderColor: 'var(--status-warning-border)',
            color: 'var(--status-warning)',
          }}
        >
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              Category or source filters are temporarily unavailable. Other filters still work.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetchCategories();
              void refetchSources();
            }}
          >
            Retry lookup data
          </Button>
        </div>
      ) : null}
    </div>
  );
}
