/**
 * Users Service
 * API calls for user management (admin functionality)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  UserListItem,
  UserDetailResponse,
  SuspendUserRequest,
  SuspendUserResponse,
  UnsuspendUserRequest,
  UnsuspendUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  UserStatus,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface UserListParams {
  page?: number;
  pageSize?: number;
  status?: UserStatus | 'ALL';
  q?: string;
  userType?: 'USER' | 'SUPPLIER' | 'ADMIN' | 'SUPERADMIN' | 'ALL';
  emailVerified?: boolean;
  sort?: 'createdAt:desc' | 'createdAt:asc' | 'lastLoginAt:desc' | 'lastLoginAt:asc';
}

// ============================================
// User List
// ============================================

/**
 * Get paginated list of users
 */
export async function getUsers(
  params: UserListParams = {}
): Promise<PaginatedResponse<UserListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: UserListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.USERS.LIST}${query}`);

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
// User Detail
// ============================================

/**
 * Get detailed user information by ID
 */
export async function getUserById(userId: string): Promise<UserDetailResponse> {
  const response = await apiClient.get<ApiSuccessResponse<UserDetailResponse>>(
    API_ROUTES.ADMIN.USERS.DETAIL(userId)
  );
  return response.data.data;
}

// ============================================
// User Actions
// ============================================

/**
 * Suspend a user account
 * Sets user status to SUSPENDED
 */
export async function suspendUser(
  userId: string,
  data: SuspendUserRequest
): Promise<SuspendUserResponse['user']> {
  const response = await apiClient.post<ApiSuccessResponse<SuspendUserResponse>>(
    API_ROUTES.ADMIN.USERS.SUSPEND(userId),
    data
  );
  return response.data.data.user;
}

export async function unsuspendUser(
  userId: string,
  data: UnsuspendUserRequest
): Promise<UnsuspendUserResponse['user']> {
  const response = await apiClient.post<ApiSuccessResponse<UnsuspendUserResponse>>(
    API_ROUTES.ADMIN.USERS.UNSUSPEND(userId),
    data
  );
  return response.data.data.user;
}

/**
 * Delete a user account (soft delete)
 * Sets user status to DELETED
 */
export async function deleteUser(
  userId: string,
  data: DeleteUserRequest
): Promise<DeleteUserResponse['user']> {
  const response = await apiClient.request<ApiSuccessResponse<DeleteUserResponse>>(
    API_ROUTES.ADMIN.USERS.DELETE(userId),
    { method: 'DELETE', body: data }
  );
  return response.data.data.user;
}
