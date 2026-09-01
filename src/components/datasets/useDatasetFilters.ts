'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatEnumLabel, formatStatusLabel } from '@/components/shared/StatusBadge';
import type { DatasetListParams } from '@/services/datasets.service';
import type { DatasetStatus, DatasetVisibility } from '@/types/dataset.types';
import { useDebounce } from '@/hooks/useDebounce';

const DATASET_STATUSES: readonly DatasetStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'REJECTED',
  'VERIFIED',
  'PUBLISHED',
  'DELISTED',
  'ARCHIVED',
];
const VISIBILITIES: readonly DatasetVisibility[] = ['PUBLIC', 'PRIVATE', 'UNLISTED'];

function enumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T | 'all'
): T | 'all' {
  if (value === 'all') return 'all';
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function positivePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function useDatasetFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = positivePage(searchParams.get('page'));
  const pageSize = 10;
  const searchQuery = searchParams.get('q') ?? '';
  const statusFilter = enumParam(searchParams.get('status'), DATASET_STATUSES, 'PUBLISHED');
  const visibilityFilter = enumParam(searchParams.get('visibility'), VISIBILITIES, 'all');
  const categoryFilter = searchParams.get('category') || 'all';
  const sourceFilter = searchParams.get('source') || 'all';
  const debouncedSearch = useDebounce(searchQuery, 500);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      if (resetPage) next.delete('page');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setPage = useCallback(
    (value: number) => updateQuery({ page: value > 1 ? String(value) : null }, false),
    [updateQuery]
  );
  const setSearchQuery = useCallback(
    (value: string) => updateQuery({ q: value.trimStart() || null }),
    [updateQuery]
  );
  const setStatusFilter = useCallback(
    (value: DatasetStatus | 'all') => updateQuery({ status: value }),
    [updateQuery]
  );
  const setVisibilityFilter = useCallback(
    (value: DatasetVisibility | 'all') =>
      updateQuery({ visibility: value === 'all' ? null : value }),
    [updateQuery]
  );
  const setCategoryFilter = useCallback(
    (value: string) => updateQuery({ category: value === 'all' ? null : value }),
    [updateQuery]
  );
  const setSourceFilter = useCallback(
    (value: string) => updateQuery({ source: value === 'all' ? null : value }),
    [updateQuery]
  );

  const filters: DatasetListParams = useMemo(
    () => ({
      page,
      pageSize,
      q: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      visibility: visibilityFilter !== 'all' ? visibilityFilter : undefined,
      primaryCategoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
      sourceId: sourceFilter !== 'all' ? sourceFilter : undefined,
    }),
    [categoryFilter, debouncedSearch, page, sourceFilter, statusFilter, visibilityFilter]
  );

  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const activeFilters = useMemo(() => {
    const values: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (statusFilter !== 'all') {
      values.push({
        key: 'status',
        label: `Status: ${formatStatusLabel(statusFilter)}`,
        onRemove: () => setStatusFilter('all'),
      });
    }

    if (visibilityFilter !== 'all') {
      values.push({
        key: 'visibility',
        label: `Visibility: ${formatEnumLabel(visibilityFilter)}`,
        onRemove: () => setVisibilityFilter('all'),
      });
    }

    if (categoryFilter !== 'all') {
      values.push({
        key: 'category',
        label: 'Category selected',
        onRemove: () => setCategoryFilter('all'),
      });
    }

    if (sourceFilter !== 'all') {
      values.push({
        key: 'source',
        label: 'Source selected',
        onRemove: () => setSourceFilter('all'),
      });
    }

    return values;
  }, [
    categoryFilter,
    setCategoryFilter,
    setSourceFilter,
    setStatusFilter,
    setVisibilityFilter,
    sourceFilter,
    statusFilter,
    visibilityFilter,
  ]);

  return {
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
    hasActiveFilters: activeFilters.length > 0 || Boolean(debouncedSearch),
    clearAllFilters,
    filters,
  };
}
