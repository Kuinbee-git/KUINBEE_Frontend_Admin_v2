/**
 * Admin Constants
 * Centralized configuration for admin management
 * All status values use UPPERCASE to match backend
 */

/**
 * Admin Status Options (for filters)
 */
export const ADMIN_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * Admin Role/Type Options (for filters)
 * Backend uses UserType: SUPERADMIN | ADMIN
 */
export const ADMIN_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'SUPERADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
];
