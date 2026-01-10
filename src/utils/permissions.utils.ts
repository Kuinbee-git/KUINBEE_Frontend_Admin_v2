/**
 * Permission utilities
 */

export interface UserPermissions {
  canViewUsers: boolean;
  canSuspendUsers: boolean;
  canDeleteUsers: boolean;
  canViewAdmins: boolean;
  canManageAdmins: boolean;
}

/**
 * Get permissions for current admin user
 * In production, this would fetch from auth context or API
 */
export function getCurrentUserPermissions(): UserPermissions {
  // Mock implementation - replace with actual auth logic
  return {
    canViewUsers: true,
    canSuspendUsers: true,
    canDeleteUsers: true,
    canViewAdmins: true,
    canManageAdmins: false,
  };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: UserPermissions,
  permission: keyof UserPermissions
): boolean {
  return permissions[permission];
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  permissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean {
  return requiredPermissions.some((perm) => permissions[perm]);
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  permissions: UserPermissions,
  requiredPermissions: (keyof UserPermissions)[]
): boolean {
  return requiredPermissions.every((perm) => permissions[perm]);
}
