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
  DeleteUserResponse,
  UserStatus,
  PaginatedResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface UserListParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  const response = await apiClient.get<PaginatedResponse<UserListItem>>(
    `${API_ROUTES.ADMIN.USERS.LIST}${query}`
  );
  return response.data;
}

// ============================================
// User Detail
// ============================================

/**
 * Get detailed user information by ID
 */
export async function getUserById(userId: string): Promise<UserDetailResponse> {
  const response = await apiClient.get<UserDetailResponse>(
    API_ROUTES.ADMIN.USERS.DETAIL(userId)
  );
  return response.data;
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
  data?: SuspendUserRequest
): Promise<SuspendUserResponse['user']> {
  const response = await apiClient.post<SuspendUserResponse>(
    API_ROUTES.ADMIN.USERS.SUSPEND(userId),
    data || {}
  );
  return response.data.user;
}

/**
 * Delete a user account (soft delete)
 * Sets user status to DELETED
 */
export async function deleteUser(userId: string): Promise<DeleteUserResponse['user']> {
  const response = await apiClient.delete<DeleteUserResponse>(
    API_ROUTES.ADMIN.USERS.DELETE(userId)
  );
  return response.data.user;
}

// ============================================
// Helpers
// ============================================

/**
 * Check if a user can be suspended
 * Cannot suspend already suspended or deleted users
 */
export function canSuspendUser(status: UserStatus): boolean {
  return status === 'ACTIVE' || status === 'PENDING_VERIFICATION';
}

/**
 * Check if a user can be deleted
 * Cannot delete already deleted users
 */
export function canDeleteUser(status: UserStatus): boolean {
  return status !== 'DELETED';
}

/**
 * Get user full name from detail response
 */
export function getUserFullName(detail: UserDetailResponse): string {
  if (detail.personalInfo) {
    const { firstName, lastName } = detail.personalInfo;
    return `${firstName} ${lastName}`.trim();
  }
  return detail.user.email;
}

/**
 * Get user display status with styling info
 */
export function getUserStatusDisplay(status: UserStatus): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'default';
} {
  const statusMap: Record<
    UserStatus,
    { label: string; variant: 'success' | 'warning' | 'error' | 'default' }
  > = {
    ACTIVE: { label: 'Active', variant: 'success' },
    INACTIVE: { label: 'Inactive', variant: 'default' },
    SUSPENDED: { label: 'Suspended', variant: 'warning' },
    PENDING_VERIFICATION: { label: 'Pending', variant: 'default' },
    DELETED: { label: 'Deleted', variant: 'error' },
  };
  return statusMap[status];
}
