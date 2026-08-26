import type { DataRequirementSource, DataRequirementStatus } from '@/types';

export const statusLabel = (status: DataRequirementStatus) =>
  status
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

export const sourceLabel = (source: DataRequirementSource) =>
  ({
    USER_APP: 'User app',
    SUPPLIER_PANEL: 'Supplier panel',
    LEGACY_IMPORT: 'Legacy import',
  })[source];

export const statusSemantic = (status: DataRequirementStatus) => {
  if (status === 'PUBLISHED') return 'success' as const;
  if (status === 'UNDER_REVIEW') return 'in_progress' as const;
  if (status === 'SUBMITTED') return 'pending' as const;
  if (status === 'REJECTED') return 'error' as const;
  return 'neutral' as const;
};

export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : '—';

export const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '—';
