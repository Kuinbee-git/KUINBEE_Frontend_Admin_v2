/**
 * UserFilters - Refactored filters using generic FilterBar component
 */

"use client";

import React from 'react';
import { FilterBar, FilterConfig, ActiveFilter } from '@/components/shared/FilterBar';
import {
  USER_STATUS_OPTIONS,
  EMAIL_VERIFIED_OPTIONS,
  DATASET_ACCESS_OPTIONS,
} from '@/constants/user.constants';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  emailVerifiedFilter: string;
  onEmailVerifiedChange: (value: string) => void;
  hasDatasetAccessFilter: string;
  onHasDatasetAccessChange: (value: string) => void;
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
}

export function UserFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  emailVerifiedFilter,
  onEmailVerifiedChange,
  hasDatasetAccessFilter,
  onHasDatasetAccessChange,
  activeFilters,
  onClearAll,
}: UserFiltersProps) {
  const filters: FilterConfig<unknown>[] = [
    {
      id: 'search',
      type: 'search',
      label: 'Search',
      placeholder: 'Search by email, phone, or organization...',
      value: searchQuery,
      onChange: (value) => onSearchChange(value as string),
      showInPrimary: true,
    },
    {
      id: 'status',
      type: 'select',
      label: 'User Status',
      value: statusFilter,
      onChange: (value) => onStatusChange(value as string),
      options: USER_STATUS_OPTIONS,
      width: 'w-[180px]',
      showInPrimary: true,
    },
    {
      id: 'emailVerified',
      type: 'select',
      label: 'Email Verified',
      value: emailVerifiedFilter,
      onChange: (value) => onEmailVerifiedChange(value as string),
      options: EMAIL_VERIFIED_OPTIONS,
      width: 'w-[150px]',
      showInPrimary: true,
    },
    {
      id: 'hasDatasetAccess',
      type: 'select',
      label: 'Has Dataset Access',
      value: hasDatasetAccessFilter,
      onChange: (value) => onHasDatasetAccessChange(value as string),
      options: DATASET_ACCESS_OPTIONS,
      width: 'w-[150px]',
      showInPrimary: true,
    },
  ];

  return (
    <FilterBar
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={onClearAll}
    />
  );
}
