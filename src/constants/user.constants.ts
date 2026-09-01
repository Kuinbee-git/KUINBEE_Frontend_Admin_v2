/**
 * User management constants
 * All status values use UPPERCASE to match backend
 */

import type { UserStatus } from '@/types/user.types';
import type { FilterOption } from '@/components/shared/FilterBar';

/**
 * User status options for filters
 */
export const USER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'DELETED', label: 'Deleted' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * Email verification filter options
 */
export const EMAIL_VERIFIED_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
];

/**
 * User status display labels
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING_VERIFICATION: 'Pending Verification',
  DELETED: 'Deleted',
  INACTIVE: 'Inactive',
};
