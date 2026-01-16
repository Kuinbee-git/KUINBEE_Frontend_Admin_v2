/**
 * Admin Types
 * Matches backend /api/v1/admin/* responses
 */

import type { UserType, UserStatus } from './auth.types';

// ============================================
// Address Types
// ============================================

export type AddressType =
  | 'PERSONAL'
  | 'BILLING'
  | 'SHIPPING'
  | 'REGISTERED_OFFICE'
  | 'BUSINESS';

export interface Address {
  id: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Personal Info
// ============================================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  profileImage: string | null;
}

// ============================================
// Admin Profile
// ============================================

export interface AdminProfileInfo {
  employeeId: string | null;
  department: string | null;
  joiningDate: string | null;
}

export interface AdminProfile {
  user: {
    id: string;
    email: string;
    phone: string | null;
  };
  personalInfo: PersonalInfo | null;
  adminProfile: AdminProfileInfo | null;
}

// ============================================
// Profile Update Request
// ============================================

export interface UpdateProfileRequest {
  phone?: string | null;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string | null;
    gender?: Gender | null;
    profileImage?: string | null;
  };
  adminProfile?: {
    department?: string | null;
  };
}

// ============================================
// Address Request Types
// ============================================

export interface CreateAddressRequest {
  addressType?: AddressType;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country?: string;
  postalCode: string;
  isDefault?: boolean;
  label?: string;
}

export interface UpdateAddressRequest {
  addressType?: AddressType;
  addressLine1?: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
  label?: string | null;
}

// ============================================
// Response Types
// ============================================

export interface ProfileResponse {
  profile: AdminProfile;
}

export interface AddressListResponse {
  items: Address[];
}

export interface AddressResponse {
  address: Address;
}

export interface MyPermissionsResponse {
  permissions: string[];
}

// ============================================
// Admin List Types (for superadmin /admins)
// ============================================

export interface AdminListItem {
  id: string;
  email: string;
  phone: string | null;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
  personalInfo: PersonalInfo | null;
  adminProfile: AdminProfileInfo | null;
  roles: AdminRole[];
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  targetType: 'DATASET' | 'SUPPLIER' | 'USER' | 'ADMIN' | 'CATEGORY' | 'SOURCE';
  targetId: string;
  targetName: string;
  details?: string;
}

// ============================================
// Admin Management API Types
// ============================================

export interface AdminRole {
  roleId: string;
  name: string;
  displayName: string;
}

export interface AdminListItemResponse {
  admin: {
    id: string;
    email: string;
    phone: string | null;
    userType: 'ADMIN' | 'SUPERADMIN';
    status: UserStatus;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    deletedAt: string | null;
  };
  adminProfile: AdminProfileInfo | null;
  roles: AdminRole[];
}

export interface AdminDetailResponse {
  admin: {
    id: string;
    email: string;
    phone: string | null;
    userType: 'ADMIN' | 'SUPERADMIN';
    status: UserStatus;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    deletedAt: string | null;
  };
  adminProfile: AdminProfileInfo | null;
  roles: AdminRole[];
}

export interface UpdateAdminRequest {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  adminProfile?: {
    department?: string | null;
  };
}

export interface UpdateAdminResponse {
  admin: {
    id: string;
    status: UserStatus;
    updatedAt: string;
  };
  adminProfile: AdminProfileInfo | null;
}

export interface DeleteAdminResponse {
  success: true;
  admin: {
    id: string;
    status: 'DELETED';
    deletedAt: string;
    updatedAt: string;
  };
}

export interface AdminRolesResponse {
  adminId: string;
  roles: AdminRole[];
}

export interface UpdateAdminRolesRequest {
  roleIds: string[];
}
