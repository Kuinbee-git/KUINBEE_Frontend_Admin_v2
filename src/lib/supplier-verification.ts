import type { SemanticStatus } from '@/components/shared/StatusBadge';
import type { SupplierVerificationStatus } from '@/types/supplier.types';

export const SUPPLIER_VERIFICATION: Record<
  SupplierVerificationStatus,
  { label: string; semantic: SemanticStatus }
> = {
  DRAFT: { label: 'Not submitted', semantic: 'neutral' },
  SUBMITTED: { label: 'Under review', semantic: 'in_progress' },
  CHANGES_REQUESTED: { label: 'Changes requested', semantic: 'warning' },
  APPROVED: { label: 'Approved', semantic: 'success' },
  REJECTED: { label: 'Rejected', semantic: 'error' },
  NOT_RECORDED: { label: 'Not recorded', semantic: 'neutral' },
};
