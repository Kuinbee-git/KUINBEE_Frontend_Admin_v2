/**
 * Auth Service
 * API calls for authentication and profile management
 * Uses cookie-based authentication (no JWT tokens)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  AuthUser,
  AcceptInviteRequest,
  AcceptInviteResponse,
  AdminPasswordChangeRequest,
  AdminPasswordMutationResponse,
  AdminPasswordResetConfirmRequest,
  AdminPasswordResetRequest,
} from '@/types/auth.types';
import type {
  AdminProfile,
  ProfileResponse,
  UpdateProfileRequest,
  MyPermissionsResponse,
} from '@/types/admin.types';
import type { ApiSuccessResponse } from '@/types/api.types';
import { normalizePermissions, type Permission } from '@/lib/constants/permissions';

// ============================================
// Authentication
// ============================================

/**
 * Login with email and password
 * On success, backend sets HTTP-only session cookie
 */
export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>(
    API_ROUTES.AUTH.LOGIN,
    credentials
  );
  return response.data.data.user;
}

/**
 * Logout current session
 * Backend clears the session cookie
 */
export async function logout(): Promise<void> {
  await apiClient.post<ApiSuccessResponse<LogoutResponse>>(API_ROUTES.AUTH.LOGOUT);
}

/**
 * Get current authenticated user
 * Uses session cookie automatically
 * Returns null if not authenticated (instead of throwing)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.request<ApiSuccessResponse<MeResponse>>(API_ROUTES.AUTH.ME, {
      method: 'GET',
    });
    return response.data.data.user;
  } catch (error) {
    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error
        ? Number(error.statusCode)
        : undefined;
    if (statusCode === 401 || statusCode === 403) return null;
    throw error;
  }
}

/**
 * Accept admin invite and set password
 * Used when a new admin accepts their invitation email
 */
export async function acceptInvite(data: AcceptInviteRequest): Promise<AuthUser> {
  const response = await apiClient.post<ApiSuccessResponse<AcceptInviteResponse>>(
    API_ROUTES.AUTH.ACCEPT_INVITE,
    data
  );
  return response.data.data.user;
}

export async function requestAdminPasswordReset(data: AdminPasswordResetRequest): Promise<void> {
  await apiClient.post<ApiSuccessResponse<AdminPasswordMutationResponse>>(
    API_ROUTES.AUTH.ADMIN_PASSWORD_RESET_REQUEST,
    data
  );
}

export async function confirmAdminPasswordReset(
  data: AdminPasswordResetConfirmRequest
): Promise<void> {
  await apiClient.post<ApiSuccessResponse<AdminPasswordMutationResponse>>(
    API_ROUTES.AUTH.ADMIN_PASSWORD_RESET_CONFIRM,
    data
  );
}

export async function changeAdminPassword(data: AdminPasswordChangeRequest): Promise<void> {
  await apiClient.post<ApiSuccessResponse<AdminPasswordMutationResponse>>(
    API_ROUTES.AUTH.ADMIN_PASSWORD_CHANGE,
    data
  );
}

// ============================================
// Profile
// ============================================

/**
 * Get current admin's profile
 * Includes personalInfo and adminProfile
 * Returns null if not found or error occurs
 */
export async function getProfile(): Promise<AdminProfile | null> {
  const response = await apiClient.get<ApiSuccessResponse<ProfileResponse>>(
    API_ROUTES.ADMIN.PROFILE
  );
  return response.data.data.profile;
}

/**
 * Update current admin's profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<AdminProfile> {
  const response = await apiClient.put<ApiSuccessResponse<ProfileResponse>>(
    API_ROUTES.ADMIN.PROFILE,
    data
  );
  return response.data.data.profile;
}

// ============================================
// Permissions
// ============================================

/**
 * Get current admin's permissions
 * Returns validated canonical permission strings (for example,
 * ['CREATE_PLATFORM_DATASET', 'MANAGE_USERS']).
 */
export async function getMyPermissions(): Promise<Permission[]> {
  const response = await apiClient.get<ApiSuccessResponse<MyPermissionsResponse>>(
    API_ROUTES.ADMIN.MY_PERMISSIONS
  );
  return normalizePermissions(response.data.data.permissions);
}
