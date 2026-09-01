/**
 * Roles Service (Superadmin)
 * API calls for role and permission management
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import { normalizePermissions, type Permission } from '@/lib/constants/permissions';
import type {
  Role,
  RoleListItem,
  CreateRoleRequest,
  UpdateRoleRequest,
  ReplacePermissionsRequest,
  RoleResponse,
  RolePermissionsResponse,
  AdminRoleAuditEntry,
  RolePermissionAuditEntry,
  AdminRoleAuditEventType,
  RolePermissionAuditEventType,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface RoleListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  isActive?: boolean;
  sort?: string;
}

export interface AdminRoleAuditParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  adminId?: string;
  roleId?: string;
  q?: string;
  eventType?: AdminRoleAuditEventType;
  actorId?: string;
  sort?: string;
}

export interface RolePermissionAuditParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  roleId?: string;
  q?: string;
  permission?: string;
  eventType?: RolePermissionAuditEventType;
  actorId?: string;
  sort?: string;
}

// ============================================
// Roles CRUD
// ============================================

/**
 * Get paginated list of roles
 */
export async function getRoles(
  params: RoleListParams = {}
): Promise<PaginatedResponse<RoleListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{ items: RoleListItem[]; page: number; pageSize: number; total: number }>
  >(`${API_ROUTES.ADMIN.ROLES.LIST}${query}`);
  // Backend wraps paginated data in { success, data } structure
  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 10,
      total: result.total ?? 0,
      // totalPages intentionally omitted for type safety
    },
  };
}

/**
 * Create a new role
 */
export async function createRole(data: CreateRoleRequest): Promise<Role> {
  const response = await apiClient.post<ApiSuccessResponse<RoleResponse>>(
    API_ROUTES.SUPERADMIN.ROLES.CREATE,
    data
  );
  return response.data.data.role;
}

/**
 * Update a role
 */
export async function updateRole(roleId: string, data: UpdateRoleRequest): Promise<Role> {
  const response = await apiClient.patch<ApiSuccessResponse<RoleResponse>>(
    API_ROUTES.SUPERADMIN.ROLES.UPDATE(roleId),
    data
  );
  return response.data.data.role;
}

// ============================================
// Role Permissions
// ============================================

/**
 * Get permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  const response = await apiClient.get<
    ApiSuccessResponse<{ roleId: string; permissions: string[] }>
  >(API_ROUTES.SUPERADMIN.ROLES.PERMISSIONS.LIST(roleId));
  return normalizePermissions(response.data.data.permissions);
}

/**
 * Replace all permissions for a role
 */
export async function replaceRolePermissions(
  roleId: string,
  data: ReplacePermissionsRequest
): Promise<Permission[]> {
  const response = await apiClient.put<ApiSuccessResponse<RolePermissionsResponse>>(
    API_ROUTES.SUPERADMIN.ROLES.PERMISSIONS.PUT(roleId),
    data
  );
  return normalizePermissions(response.data.data.permissions);
}

// ============================================
// Audit
// ============================================

/**
 * Get admin role assignment audit log
 */
export async function getAdminRoleAudit(
  params: AdminRoleAuditParams = {}
): Promise<PaginatedResponse<AdminRoleAuditEntry>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: AdminRoleAuditEntry[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.SUPERADMIN.AUDIT.ADMIN_ROLES}${query}`);

  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 50,
      total: result.total ?? 0,
    },
  };
}

/**
 * Get role permission changes audit log
 */
export async function getRolePermissionAudit(
  params: RolePermissionAuditParams = {}
): Promise<PaginatedResponse<RolePermissionAuditEntry>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: RolePermissionAuditEntry[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.SUPERADMIN.AUDIT.ROLE_PERMISSIONS}${query}`);

  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 50,
      total: result.total ?? 0,
    },
  };
}

// ============================================
// Permissions List
// ============================================

/**
 * Get all available permissions in the system
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const response = await apiClient.get<ApiSuccessResponse<{ permissions: string[] }>>(
    API_ROUTES.PERMISSIONS
  );
  return normalizePermissions(response.data.data.permissions);
}
