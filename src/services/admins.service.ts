/**
 * Admins Service
 * API calls for admin management (superadmin functionality)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  AdminListItemResponse,
  AdminDetailResponse,
  UpdateAdminRequest,
  UpdateAdminResponse,
  DeleteAdminResponse,
  AdminRolesResponse,
  UpdateAdminRolesRequest,
  UserStatus,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface AdminListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: UserStatus | 'ALL';
  sort?: string;
  roleId?: string;
}

// ============================================
// Admin List
// ============================================

/**
 * Get paginated list of admins
 */
export async function getAdmins(
  params: AdminListParams = {}
): Promise<PaginatedResponse<AdminListItemResponse>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<ApiSuccessResponse<{
    items: AdminListItemResponse[];
    page: number;
    pageSize: number;
    total: number;
  }>>(
    `${API_ROUTES.ADMIN.ADMINS.LIST}${query}`
  );
  
  // Backend wraps paginated data in { success, data } structure
  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 10,
      total: result.total ?? 0,
    },
  };
}

// ============================================
// Admin Detail
// ============================================

/**
 * Get detailed admin information by ID
 */
export async function getAdminById(adminId: string): Promise<AdminDetailResponse> {
  const response = await apiClient.get<ApiSuccessResponse<AdminDetailResponse>>(
    API_ROUTES.ADMIN.ADMINS.DETAIL(adminId)
  );
  return response.data.data;
}

// ============================================
// Admin Update
// ============================================

/**
 * Update an admin's profile and settings
 */
export async function updateAdmin(
  adminId: string,
  data: UpdateAdminRequest
): Promise<UpdateAdminResponse> {
  const response = await apiClient.patch<ApiSuccessResponse<UpdateAdminResponse>>(
    API_ROUTES.ADMIN.ADMINS.UPDATE(adminId),
    data
  );
  return response.data.data;
}

// ============================================
// Admin Delete
// ============================================

/**
 * Delete an admin (soft delete)
 */
export async function deleteAdmin(adminId: string): Promise<DeleteAdminResponse> {
  const response = await apiClient.delete<ApiSuccessResponse<DeleteAdminResponse>>(
    API_ROUTES.ADMIN.ADMINS.DELETE(adminId)
  );
  return response.data.data;
}

// ============================================
// Admin Roles
// ============================================

/**
 * Get roles assigned to an admin
 */
export async function getAdminRoles(adminId: string): Promise<AdminRolesResponse> {
  const response = await apiClient.get<ApiSuccessResponse<AdminRolesResponse>>(
    API_ROUTES.ADMIN.ADMINS.ROLES.LIST(adminId)
  );
  return response.data.data;
}

/**
 * Update roles for an admin (replaces all roles)
 */
export async function updateAdminRoles(
  adminId: string,
  data: UpdateAdminRolesRequest
): Promise<AdminRolesResponse> {
  const response = await apiClient.put<ApiSuccessResponse<AdminRolesResponse>>(
    API_ROUTES.ADMIN.ADMINS.ROLES.UPDATE(adminId),
    data
  );
  return response.data.data;
}

// ============================================
// Helpers
// ============================================

/**
 * Check if an admin can be deleted
 */
export function canDeleteAdmin(status: UserStatus): boolean {
  return status !== 'DELETED';
}

/**
 * Check if an admin can be suspended
 */
export function canSuspendAdmin(status: UserStatus): boolean {
  return status === 'ACTIVE' || status === 'PENDING_VERIFICATION';
}
