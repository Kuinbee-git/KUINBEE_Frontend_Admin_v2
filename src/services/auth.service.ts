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
} from '@/types/auth.types';
import type {
  AdminProfile,
  ProfileResponse,
  UpdateProfileRequest,
  Address,
  AddressListResponse,
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  MyPermissionsResponse,
} from '@/types/admin.types';

// ============================================
// Authentication
// ============================================

/**
 * Login with email and password
 * On success, backend sets HTTP-only session cookie
 */
export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiClient.post<LoginResponse>(
    API_ROUTES.AUTH.LOGIN,
    credentials
  );
  return response.data.user;
}

/**
 * Logout current session
 * Backend clears the session cookie
 */
export async function logout(): Promise<void> {
  await apiClient.post<LogoutResponse>(API_ROUTES.AUTH.LOGOUT);
}

/**
 * Get current authenticated user
 * Uses session cookie automatically
 * Returns null if not authenticated (instead of throwing)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<MeResponse>(API_ROUTES.AUTH.ME);
    // Backend wraps response in { success, data: { user } }
    const user = (response.data as { data?: { user?: AuthUser } }).data?.user ?? response.data.user ?? null;
    return user;
  } catch {
    // Return null for auth errors (401, 403) instead of throwing
    return null;
  }
}

/**
 * Accept admin invite and set password
 * Used when a new admin accepts their invitation email
 */
export async function acceptInvite(data: AcceptInviteRequest): Promise<AuthUser> {
  const response = await apiClient.post<AcceptInviteResponse>(
    API_ROUTES.AUTH.ACCEPT_INVITE,
    data
  );
  return response.data.user;
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
  try {
    const response = await apiClient.get<ProfileResponse>(API_ROUTES.ADMIN.PROFILE);
    // Backend wraps response in { success, data: { profile } }
    const profile = (response.data as { data?: { profile?: AdminProfile } }).data?.profile ?? response.data.profile ?? null;
    return profile;
  } catch (error) {
    console.warn('[Auth Service] Failed to fetch profile:', error);
    return null;
  }
}

/**
 * Update current admin's profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<AdminProfile> {
  const response = await apiClient.put<ProfileResponse>(
    API_ROUTES.ADMIN.PROFILE,
    data
  );
  return response.data.profile;
}

// ============================================
// Permissions
// ============================================

/**
 * Get current admin's permissions
 * Returns array of permission strings (e.g., ['datasets.view', 'users.edit'])
 * Returns empty array if fetch fails (e.g., due to CORS/cookie issues)
 */
export async function getMyPermissions(): Promise<string[]> {
  try {
    const response = await apiClient.get<MyPermissionsResponse>(
      API_ROUTES.ADMIN.MY_PERMISSIONS
    );
    // Backend wraps response in { success, data: { permissions } }
    const permissions = (response.data as { data?: { permissions?: string[] } }).data?.permissions ?? response.data.permissions ?? [];
    return permissions;
  } catch (error) {
    console.warn('[Auth Service] Failed to fetch permissions:', error);
    // Return empty array instead of throwing - allows app to continue
    return [];
  }
}

// ============================================
// Addresses
// ============================================

/**
 * Get current admin's addresses
 * Returns empty array if error occurs
 */
export async function getAddresses(): Promise<Address[]> {
  try {
    const response = await apiClient.get<AddressListResponse>(
      API_ROUTES.ADMIN.ADDRESSES.LIST
    );
    return response.data.items ?? [];
  } catch (error) {
    console.warn('[Auth Service] Failed to fetch addresses:', error);
    return [];
  }
}

/**
 * Create a new address
 */
export async function createAddress(data: CreateAddressRequest): Promise<Address> {
  const response = await apiClient.post<AddressResponse>(
    API_ROUTES.ADMIN.ADDRESSES.CREATE,
    data
  );
  return response.data.address;
}

/**
 * Update an existing address
 */
export async function updateAddress(
  addressId: string,
  data: UpdateAddressRequest
): Promise<Address> {
  const response = await apiClient.patch<AddressResponse>(
    API_ROUTES.ADMIN.ADDRESSES.UPDATE(addressId),
    data
  );
  return response.data.address;
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.ADDRESSES.DELETE(addressId));
}

// ============================================
// Auth Helpers
// ============================================

/**
 * Check if user is authenticated
 * Makes a lightweight call to verify session is valid
 */
export async function checkAuth(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user with permissions in a single operation
 * Useful for initial app load
 */
export async function getAuthState(): Promise<{
  user: AuthUser | null;
  permissions: string[];
}> {
  const [user, permissions] = await Promise.all([
    getCurrentUser(),
    getMyPermissions(),
  ]);
  return { user, permissions };
}
