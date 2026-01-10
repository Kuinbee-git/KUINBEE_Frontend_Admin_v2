/**
 * Role Types
 * Matches backend /api/v1/superadmin/roles/* responses
 */

// ============================================
// Enums
// ============================================

export type AdminRoleAuditEventType = 'ASSIGNED' | 'REVOKED';

export type RolePermissionAuditEventType = 'ADDED' | 'REMOVED' | 'REPLACED';

// ============================================
// Role Entity
// ============================================

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Included in list view */
  permissionCount?: number;
  /** Included in detail view */
  permissions?: string[];
}

export interface RoleListItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissionCount: number;
}

// ============================================
// Request Types
// ============================================

export interface CreateRoleRequest {
  /** Unique, recommended format: ^[A-Z0-9_]{3,50}$ */
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ReplacePermissionsRequest {
  permissions: string[];
}

export interface AddPermissionRequest {
  permission: string;
}

export interface RemovePermissionRequest {
  permission: string;
}

// ============================================
// Response Types
// ============================================

export interface RoleResponse {
  role: Role;
}

export interface RolePermissionsResponse {
  roleId: string;
  permissions: string[];
}

// ============================================
// Audit Types
// ============================================

export interface AdminRoleAuditEntry {
  id: string;
  eventType: AdminRoleAuditEventType;
  admin: {
    id: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
    displayName: string;
  };
  actor: {
    id: string;
    email: string;
  };
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface RolePermissionAuditEntry {
  id: string;
  eventType: RolePermissionAuditEventType;
  role: {
    id: string;
    name: string;
    displayName: string;
  };
  permission: string;
  actor: {
    id: string;
    email: string;
  };
  createdAt: string;
  metadata: Record<string, unknown> | null;
}
