/**
 * Role Types
 * Matches backend /api/v1/superadmin/roles/* responses
 */

import type { Permission } from '@/lib/constants/permissions';

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
  permissions?: Permission[];
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
  permissions: Permission[];
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ReplacePermissionsRequest {
  permissions: Permission[];
}

// ============================================
// Response Types
// ============================================

export interface RoleResponse {
  role: Role;
}

export interface RolePermissionsResponse {
  roleId: string;
  permissions: Permission[];
}

// ============================================
// Audit Types
// ============================================

export interface AdminRoleAuditEntry {
  id: string;
  eventType: AdminRoleAuditEventType;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
    displayName: string;
  };
  actor: {
    id: string;
    name: string;
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
    name: string;
    email: string;
  };
  createdAt: string;
  metadata: Record<string, unknown> | null;
}
