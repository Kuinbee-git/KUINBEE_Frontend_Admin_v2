/**
 * Roles Service (Superadmin)
 * API calls for role and permission management
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  Role,
  RoleListItem,
  CreateRoleRequest,
  UpdateRoleRequest,
  ReplacePermissionsRequest,
  AddPermissionRequest,
  RemovePermissionRequest,
  UpdateAdminRolesRequest,
  RoleResponse,
  RolePermissionsResponse,
  AdminRolesResponse,
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
  const response = await apiClient.get<ApiSuccessResponse<{ items: RoleListItem[]; page: number; pageSize: number; total: number }>>(
    `${API_ROUTES.SUPERADMIN.ROLES.LIST}${query}`
  );
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
 * Get role detail by ID
 */
export async function getRoleById(roleId: string): Promise<Role> {
  const response = await apiClient.get<RoleResponse>(
    API_ROUTES.SUPERADMIN.ROLES.DETAIL(roleId)
  );
  return response.data.role;
}

/**
 * Create a new role
 */
export async function createRole(data: CreateRoleRequest): Promise<Role> {
  const response = await apiClient.post<RoleResponse>(
    API_ROUTES.SUPERADMIN.ROLES.CREATE,
    data
  );
  return response.data.role;
}

/**
 * Update a role
 */
export async function updateRole(roleId: string, data: UpdateRoleRequest): Promise<Role> {
  const response = await apiClient.patch<RoleResponse>(
    API_ROUTES.SUPERADMIN.ROLES.UPDATE(roleId),
    data
  );
  return response.data.role;
}

// ============================================
// Role Permissions
// ============================================

/**
 * Get permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  const response = await apiClient.get<{ data: { roleId: string; permissions: string[] } }>(
    API_ROUTES.SUPERADMIN.ROLES.PERMISSIONS.LIST(roleId)
  );
  return response.data.data.permissions;
}

/**
 * Replace all permissions for a role
 */
export async function replaceRolePermissions(
  roleId: string,
  data: ReplacePermissionsRequest
): Promise<string[]> {
  const response = await apiClient.put<RolePermissionsResponse>(
    API_ROUTES.SUPERADMIN.ROLES.PERMISSIONS.REPLACE(roleId),
    data
  );
  return response.data.permissions;
}

/**
 * Add a permission to a role
 */
export async function addRolePermission(
  roleId: string,
  data: AddPermissionRequest
): Promise<string[]> {
  const response = await apiClient.post<RolePermissionsResponse>(
    API_ROUTES.SUPERADMIN.ROLES.PERMISSIONS.ADD(roleId),
    data
  );
  return response.data.permissions;
}

/**
 * Remove a permission from a role
 */
export async function removeRolePermission(
  roleId: string,
  data: RemovePermissionRequest
): Promise<string[]> {
  const response = await apiClient.delete<RolePermissionsResponse>(
    API_ROUTES.SUPERADMIN.ROLES.PERMISSIONS.REMOVE(roleId),
    { permission: data.permission }
  );
  return response.data.permissions;
}

// ============================================
// Admin Roles
// ============================================

/**
 * Get roles assigned to an admin
 */
export async function getAdminRoles(adminId: string): Promise<AdminRolesResponse['roles']> {
  const response = await apiClient.get<AdminRolesResponse>(
    API_ROUTES.SUPERADMIN.ADMIN_ROLES.LIST(adminId)
  );
  return response.data.roles;
}

/**
 * Update roles for an admin (replaces all roles)
 */
export async function updateAdminRoles(
  adminId: string,
  data: UpdateAdminRolesRequest
): Promise<AdminRolesResponse['roles']> {
  const response = await apiClient.put<AdminRolesResponse>(
    API_ROUTES.SUPERADMIN.ADMIN_ROLES.UPDATE(adminId),
    data
  );
  return response.data.roles;
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
  const response = await apiClient.get<ApiSuccessResponse<{
    items: AdminRoleAuditEntry[];
    page: number;
    pageSize: number;
    total: number;
  }>>(
    `${API_ROUTES.SUPERADMIN.AUDIT.ADMIN_ROLES}${query}`
  );
  
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
  const response = await apiClient.get<ApiSuccessResponse<{
    items: RolePermissionAuditEntry[];
    page: number;
    pageSize: number;
    total: number;
  }>>(
    `${API_ROUTES.SUPERADMIN.AUDIT.ROLE_PERMISSIONS}${query}`
  );
  
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
export async function getAllPermissions(): Promise<string[]> {
  const response = await apiClient.get<{ data: { permissions: string[] } }>(
    API_ROUTES.PERMISSIONS
  );
  return response.data.data.permissions;
}
