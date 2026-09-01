'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { DatasetStatus, VerificationStatus } from '@/types/dataset.types';

export type AssignmentFilter = 'all' | 'ME' | 'UNASSIGNED';

const DATASET_STATUSES: readonly DatasetStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'REJECTED',
  'VERIFIED',
  'PUBLISHED',
  'DELISTED',
  'ARCHIVED',
];
const FILTERABLE_VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  'SUBMITTED',
  'CHANGES_REQUESTED',
  'RESUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
];
const ASSIGNMENT_FILTERS: readonly Exclude<AssignmentFilter, 'all'>[] = ['ME', 'UNASSIGNED'];

function enumParam<T extends string>(value: string | null, allowed: readonly T[]): T | 'all' {
  if (!value || value === 'all') return 'all';
  return allowed.includes(value as T) ? (value as T) : 'all';
}

function positivePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function useReviewQueueFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('q') ?? '';
  const statusFilter = enumParam(searchParams.get('status'), DATASET_STATUSES);
  const verificationFilter = enumParam(
    searchParams.get('verification'),
    FILTERABLE_VERIFICATION_STATUSES
  );
  const assignmentFilter = enumParam(searchParams.get('assignment'), ASSIGNMENT_FILTERS);
  const page = positivePage(searchParams.get('page'));
  const debouncedSearch = useDebounce(searchQuery, 500);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all') next.delete(key);
        else next.set(key, value);
      });
      if (resetPage) next.delete('page');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setSearchQuery = useCallback(
    (value: string) => updateQuery({ q: value.trimStart() || null }),
    [updateQuery]
  );
  const setStatusFilter = useCallback(
    (value: DatasetStatus | 'all') => updateQuery({ status: value }),
    [updateQuery]
  );
  const setVerificationFilter = useCallback(
    (value: VerificationStatus | 'all') => updateQuery({ verification: value }),
    [updateQuery]
  );
  const setAssignmentFilter = useCallback(
    (value: AssignmentFilter) => updateQuery({ assignment: value }),
    [updateQuery]
  );
  const setPage = useCallback(
    (value: number) => updateQuery({ page: value > 1 ? String(value) : null }, false),
    [updateQuery]
  );
  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    searchQuery,
    debouncedSearch,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    verificationFilter,
    setVerificationFilter,
    assignmentFilter,
    setAssignmentFilter,
    page,
    setPage,
    clearAllFilters,
  };
}
