/**
 * Admin Utilities
 * Helper functions for admin management
 * Uses string-based permissions matching backend
 */

import { UserType, UserStatus } from '@/types/auth.types';

/**
 * Get admin type label
 */
export function getAdminTypeLabel(type: UserType): string {
  const labels: Record<UserType, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Admin',
    SUPPLIER: 'Supplier',
    USER: 'User',
  };
  return labels[type] || type;
}

/**
 * Get admin status info
 */
export function getAdminStatusInfo(status: UserStatus) {
  const statusMap: Record<
    UserStatus,
    { label: string; variant: 'success' | 'error' | 'secondary' | 'warning'; description: string }
  > = {
    ACTIVE: {
      label: 'Active',
      variant: 'success',
      description: 'Admin account is active',
    },
    SUSPENDED: {
      label: 'Suspended',
      variant: 'error',
      description: 'Admin account is temporarily suspended',
    },
    INACTIVE: {
      label: 'Inactive',
      variant: 'secondary',
      description: 'Admin account is inactive',
    },
    PENDING_VERIFICATION: {
      label: 'Pending Verification',
      variant: 'warning',
      description: 'Admin account is pending verification',
    },
    DELETED: {
      label: 'Deleted',
      variant: 'secondary',
      description: 'Admin account has been deleted',
    },
  };
  return (
    statusMap[status] || {
      label: status,
      variant: 'secondary' as const,
      description: 'Unknown status',
    }
  );
}
