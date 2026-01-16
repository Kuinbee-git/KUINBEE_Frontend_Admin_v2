/**
 * Admin Utilities
 * Helper functions for admin management
 * Uses string-based permissions matching backend
 */

import { UserType, UserStatus } from '@/types/auth.types';

// ============================================
// Permission Helpers
// ============================================

/**
 * Get permissions by domain from a string array
 */
export function getPermissionsByDomain(
  permissions: string[],
  domain: string
): string[] {
  return permissions.filter(p => p.includes(domain.toUpperCase()));
}

/**
 * Check if admin has a specific permission
 */
export function hasAdminPermission(
  permissions: string[],
  permissionId: string
): boolean {
  return permissions.includes(permissionId);
}

/**
 * Count granted permissions
 */
export function countGrantedPermissions(permissions: string[]): number {
  return permissions.length;
}

/**
 * Derive admin type from permissions
 * SUPERADMIN: 25+ permissions
 * ADMIN: <25 permissions
 */
export function deriveTypeFromPermissions(permissions: string[]): Extract<UserType, 'SUPERADMIN' | 'ADMIN'> {
  const grantedCount = permissions.length;
  return grantedCount >= 25 ? 'SUPERADMIN' : 'ADMIN';
}

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
  const statusMap: Record<UserStatus, { label: string; variant: 'success' | 'error' | 'secondary' | 'warning'; description: string }> = {
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
  return statusMap[status] || {
    label: status,
    variant: 'secondary' as const,
    description: 'Unknown status',
  };
}

/**
 * Get permission changes between two permission sets
 */
export function getPermissionChanges(
  oldPermissions: string[],
  newPermissions: string[]
): { added: string[]; removed: string[] } {
  const added = newPermissions.filter(p => !oldPermissions.includes(p));
  const removed = oldPermissions.filter(p => !newPermissions.includes(p));
  return { added, removed };
}

/**
 * Format permission for display
 */
export function formatPermissionLabel(permissionId: string): string {
  return permissionId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if current user can edit target admin
 * (Prevent lower-level admins from editing higher-level admins)
 */
export function canEditAdmin(
  currentAdminType: UserType,
  targetAdminType: UserType
): boolean {
  const typeHierarchy: Record<UserType, number> = {
    SUPERADMIN: 4,
    ADMIN: 3,
    SUPPLIER: 2,
    USER: 1,
  };

  return typeHierarchy[currentAdminType] >= typeHierarchy[targetAdminType];
}

// ============================================
// Legacy compatibility exports (deprecated)
// ============================================

/** @deprecated Use deriveTypeFromPermissions */
export const deriveRoleFromPermissions = deriveTypeFromPermissions;

/** @deprecated Use getAdminTypeLabel */
export function getAdminRoleLabel(type: UserType): string {
  return getAdminTypeLabel(type);
}
