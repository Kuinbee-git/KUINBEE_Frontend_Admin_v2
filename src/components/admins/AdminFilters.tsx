/**
 * AdminFilters - Admin filter bar using generic FilterBar
 */
"use client";
import React from 'react';
import { FilterBar, FilterConfig } from '@/components/shared/FilterBar';
import { ADMIN_STATUS_OPTIONS, ADMIN_TYPE_OPTIONS, DEPARTMENT_OPTIONS } from '@/constants/admin.constants';

interface AdminFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  onClearAll: () => void;
}

export function AdminFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  departmentFilter,
  setDepartmentFilter,
  onClearAll,
}: AdminFiltersProps) {
  const filters: FilterConfig<unknown>[] = [
    {
      id: 'search',
      type: 'search',
      label: 'Search',
      placeholder: 'Search admins by name or email...',
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      showInPrimary: true,
    },
    {
      id: 'status',
      type: 'select',
      label: 'Status',
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as string),
      options: ADMIN_STATUS_OPTIONS,
    },
    {
      id: 'type',
      type: 'select',
      label: 'Type',
      value: typeFilter,
      onChange: (value) => setTypeFilter(value as string),
      options: ADMIN_TYPE_OPTIONS,
    },
    {
      id: 'department',
      type: 'select',
      label: 'Department',
      value: departmentFilter,
      onChange: (value) => setDepartmentFilter(value as string),
      options: DEPARTMENT_OPTIONS,
    },
  ];

  return (
    <FilterBar
      filters={filters}
      onClearAll={onClearAll}
    />
  );
}
