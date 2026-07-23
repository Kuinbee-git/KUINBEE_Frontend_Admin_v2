import type { CustomCollectionLeadStatus, CustomCollectionRevisionStatus } from '@/types';

export const formatCustomCollectionStatus = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const revisionStatusSemantic = (status: CustomCollectionRevisionStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'success' as const;
    case 'UNDER_REVIEW':
      return 'in_progress' as const;
    case 'SUBMITTED':
    case 'RESUBMITTED':
      return 'pending' as const;
    case 'CHANGES_REQUESTED':
      return 'warning' as const;
    case 'REJECTED':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
};

export const leadStatusSemantic = (status: CustomCollectionLeadStatus) => {
  switch (status) {
    case 'WON':
      return 'success' as const;
    case 'CONTACTED':
    case 'QUALIFYING':
      return 'in_progress' as const;
    case 'NEW':
      return 'pending' as const;
    case 'LOST':
    case 'SPAM':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
};

export const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : '—';

export const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : '—';
