/**
 * Authentication Types
 * Matches backend /api/v1/auth/* responses
 */

// ============================================
// Enums (matching backend exactly)
// ============================================

export type UserType = 'SUPERADMIN' | 'ADMIN' | 'SUPPLIER' | 'USER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';

// ============================================
// Auth User (from /auth/me, /auth/login)
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
}

// ============================================
// Request Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AcceptInviteRequest {
  /** Raw invite token from email URL */
  token: string;
  /** Minimum 8 characters */
  password: string;
}

export interface AdminPasswordResetRequest {
  email: string;
}

export interface AdminPasswordResetConfirmRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface AdminPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// Response Types
// ============================================

export interface LoginResponse {
  user: AuthUser;
}

export interface LogoutResponse {
  success: true;
}

export interface MeResponse {
  user: AuthUser;
}

export interface AcceptInviteResponse {
  user: AuthUser;
}

export interface AdminPasswordMutationResponse {
  success: true;
}
