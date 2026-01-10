/**
 * Admin Constants
 * Centralized configuration for admin management
 * All status values use UPPERCASE to match backend
 */

import type { UserType, UserStatus } from '@/types/auth.types';

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

/**
 * Department Options
 */
export const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'Platform Operations', label: 'Platform Operations' },
  { value: 'Data Quality', label: 'Data Quality' },
  { value: 'Customer Support', label: 'Customer Support' },
  { value: 'Security & Compliance', label: 'Security & Compliance' },
  { value: 'Product Management', label: 'Product Management' },
];

/**
 * Admin Type Labels
 */
export const ADMIN_TYPE_LABELS: Record<Extract<UserType, 'SUPERADMIN' | 'ADMIN'>, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
};

/**
 * Admin Status Labels
 */
export const ADMIN_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive',
  PENDING_VERIFICATION: 'Pending Verification',
  DELETED: 'Deleted',
};

/**
 * Empty State Messages
 */
export const EMPTY_MESSAGES = {
  noAdmins: 'No admins found',
  noResults: 'No admins match your filters',
  noAuditLogs: 'No audit logs available',
  noPermissions: 'No permissions assigned',
} as const;

/**
 * Mock Admin Stats (for dashboard)
 */
export const MOCK_ADMIN_STATS = {
  totalAdmins: 12,
  activeAdmins: 10,
  suspendedAdmins: 1,
  inactiveAdmins: 1,
  superAdmins: 2,
  admins: 10,
  actionsThisMonth: 2847,
} as const;

/**
 * Permission Domain Labels
 */
export const PERMISSION_DOMAIN_LABELS = {
  datasets: 'Datasets',
  suppliers: 'Suppliers',
  users: 'Users',
  categories: 'Categories',
  sources: 'Sources',
  admins: 'Admins',
} as const;
