/**
 * User management constants
 * All status values use UPPERCASE to match backend
 */

import { UserStatus, AccessType } from '@/types/user.types';
import { FilterOption } from '@/components/shared/FilterBar';

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
 * Dataset access filter options
 */
export const DATASET_ACCESS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/**
 * Access type display labels
 */
export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  PURCHASED: 'Purchased',
  FREE: 'Free',
  TRIAL: 'Trial',
  GIFTED: 'Gifted',
};

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

/**
 * Default empty messages
 */
export const EMPTY_MESSAGES = {
  NO_USERS: 'No users in the system',
  NO_SEARCH_RESULTS: 'No users match your search or filters',
  NO_DATASET_ACCESS: 'No dataset access granted',
  NO_ORDERS: 'No orders placed',
  NO_DOWNLOADS: 'No downloads recorded',
  NO_AUDIT_LOGS: 'No audit logs available',
};
