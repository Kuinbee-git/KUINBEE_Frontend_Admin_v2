'use client';

import { FilterBar, FilterConfig, ActiveFilter } from '@/components/shared/FilterBar';
import { formatEnumLabel } from '@/components/shared/StatusBadge';
import { SUPPLIER_VERIFICATION } from '@/lib/supplier-verification';
import type { SupplierVerificationStatus } from '@/types/supplier.types';
import type { BusinessDomain } from '@/types/supplier.types';

type SupplierType = 'ALL' | 'INDIVIDUAL' | 'COMPANY';
type SupplierStatus =
  | 'ALL'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION'
  | 'DELETED';

interface SupplierFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: SupplierType;
  setTypeFilter: (value: SupplierType) => void;
  statusFilter: SupplierStatus;
  setStatusFilter: (value: SupplierStatus) => void;
  selectedDomains: BusinessDomain[];
  setSelectedDomains: (value: BusinessDomain[]) => void;
  verificationFilter: SupplierVerificationStatus | 'ALL';
  setVerificationFilter: (value: SupplierVerificationStatus | 'ALL') => void;
  contractFilter: string;
  setContractFilter: (value: string) => void;
  emailVerifiedFilter: string;
  setEmailVerifiedFilter: (value: string) => void;
  domainList: Array<{ value: BusinessDomain; label: string }>;
  clearAllFilters: () => void;
}

export function SupplierFilters({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  selectedDomains,
  setSelectedDomains,
  verificationFilter,
  setVerificationFilter,
  contractFilter,
  setContractFilter,
  emailVerifiedFilter,
  setEmailVerifiedFilter,
  domainList,
  clearAllFilters,
}: SupplierFiltersProps) {
  const filters: FilterConfig<unknown>[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      value: searchQuery,
      onChange: (value) => setSearchQuery(value as string),
      placeholder: 'Search name, email, contact, or ID...',
    },
    {
      id: 'type',
      label: 'Supplier Type',
      type: 'select',
      value: typeFilter,
      onChange: (value) => setTypeFilter(value as SupplierType),
      options: [
        { value: 'ALL', label: 'All Types' },
        { value: 'INDIVIDUAL', label: 'Individual' },
        { value: 'COMPANY', label: 'Company' },
      ],
    },
    {
      id: 'status',
      label: 'Account status',
      type: 'select',
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as SupplierStatus),
      options: [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
        { value: 'DELETED', label: 'Deleted' },
      ],
    },
    {
      id: 'verification',
      label: 'Verification status',
      type: 'select',
      value: verificationFilter,
      onChange: (value) => setVerificationFilter(value as SupplierVerificationStatus | 'ALL'),
      options: [
        { value: 'ALL', label: 'All verification states' },
        ...Object.entries(SUPPLIER_VERIFICATION).map(([value, state]) => ({
          value,
          label: state.label,
        })),
      ],
    },
    {
      id: 'contract',
      label: 'Contract',
      type: 'select',
      value: contractFilter,
      onChange: (value) => setContractFilter(value as string),
      options: [
        { value: 'all', label: 'All contracts' },
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    {
      id: 'email-verified',
      showInPrimary: false,
      label: 'Email Verified',
      type: 'select',
      value: emailVerifiedFilter,
      onChange: (value) => setEmailVerifiedFilter(value as string),
      options: [
        { value: 'all', label: 'All' },
        { value: 'verified', label: 'Verified' },
        { value: 'unverified', label: 'Unverified' },
      ],
    },
    {
      id: 'domains',
      showInPrimary: false,
      label: 'Business Domains',
      type: 'popover',
      value: selectedDomains,
      onChange: (value) => setSelectedDomains(value as BusinessDomain[]),
      options: domainList,
    },
  ];

  const activeFilters: ActiveFilter[] = [];

  if (typeFilter !== 'ALL') {
    activeFilters.push({
      key: 'type',
      label: `Type: ${formatEnumLabel(typeFilter)}`,
      onRemove: () => setTypeFilter('ALL'),
    });
  }

  if (statusFilter !== 'ALL') {
    activeFilters.push({
      key: 'status',
      label: `Status: ${formatEnumLabel(statusFilter)}`,
      onRemove: () => setStatusFilter('ALL'),
    });
  }

  if (verificationFilter !== 'ALL')
    activeFilters.push({
      key: 'verification',
      label: `Verification: ${SUPPLIER_VERIFICATION[verificationFilter].label}`,
      onRemove: () => setVerificationFilter('ALL'),
    });
  if (contractFilter !== 'all')
    activeFilters.push({
      key: 'contract',
      label: `Contract: ${contractFilter === 'completed' ? 'Completed' : 'Pending'}`,
      onRemove: () => setContractFilter('all'),
    });

  if (emailVerifiedFilter !== 'all') {
    activeFilters.push({
      key: 'emailVerified',
      label: `Email: ${emailVerifiedFilter === 'verified' ? 'Verified' : 'Unverified'}`,
      onRemove: () => setEmailVerifiedFilter('all'),
    });
  }

  selectedDomains.forEach((domain) => {
    const label = domainList.find((option) => option.value === domain)?.label ?? domain;
    activeFilters.push({
      key: `domain-${domain}`,
      label: `Domain: ${label}`,
      onRemove: () => setSelectedDomains(selectedDomains.filter((d) => d !== domain)),
    });
  });

  return (
    <FilterBar
      showAdvancedFilters
      filters={filters}
      activeFilters={activeFilters}
      onClearAll={clearAllFilters}
    />
  );
}
