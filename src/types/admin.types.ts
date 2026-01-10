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

// ============================================
// Permission Constants
// ============================================

export const ADMIN_PERMISSIONS = [
  // Datasets (6)
  { id: 'datasets.view', label: 'View Datasets', domain: 'datasets', action: 'read' },
  { id: 'datasets.approve', label: 'Approve Datasets', domain: 'datasets', action: 'approve' },
  { id: 'datasets.reject', label: 'Reject Datasets', domain: 'datasets', action: 'reject' },
  { id: 'datasets.edit', label: 'Edit Datasets', domain: 'datasets', action: 'update' },
  { id: 'datasets.delete', label: 'Delete Datasets', domain: 'datasets', action: 'delete' },
  { id: 'datasets.quality', label: 'Quality Check Datasets', domain: 'datasets', action: 'read' },

  // Suppliers (5)
  { id: 'suppliers.view', label: 'View Suppliers', domain: 'suppliers', action: 'read' },
  { id: 'suppliers.verify', label: 'Verify Suppliers', domain: 'suppliers', action: 'approve' },
  { id: 'suppliers.edit', label: 'Edit Suppliers', domain: 'suppliers', action: 'update' },
  { id: 'suppliers.suspend', label: 'Suspend Suppliers', domain: 'suppliers', action: 'delete' },
  { id: 'suppliers.delete', label: 'Delete Suppliers', domain: 'suppliers', action: 'delete' },

  // Users (5)
  { id: 'users.view', label: 'View Users', domain: 'users', action: 'read' },
  { id: 'users.edit', label: 'Edit Users', domain: 'users', action: 'update' },
  { id: 'users.suspend', label: 'Suspend Users', domain: 'users', action: 'delete' },
  { id: 'users.delete', label: 'Delete Users', domain: 'users', action: 'delete' },
  { id: 'users.activity', label: 'View User Activity', domain: 'users', action: 'read' },

  // Categories (5)
  { id: 'categories.view', label: 'View Categories', domain: 'categories', action: 'read' },
  { id: 'categories.create', label: 'Create Categories', domain: 'categories', action: 'create' },
  { id: 'categories.edit', label: 'Edit Categories', domain: 'categories', action: 'update' },
  { id: 'categories.merge', label: 'Merge Categories', domain: 'categories', action: 'update' },
  { id: 'categories.delete', label: 'Delete Categories', domain: 'categories', action: 'delete' },

  // Sources (5)
  { id: 'sources.view', label: 'View Sources', domain: 'sources', action: 'read' },
  { id: 'sources.create', label: 'Create Sources', domain: 'sources', action: 'create' },
  { id: 'sources.edit', label: 'Edit Sources', domain: 'sources', action: 'update' },
  { id: 'sources.archive', label: 'Archive Sources', domain: 'sources', action: 'delete' },
  { id: 'sources.delete', label: 'Delete Sources', domain: 'sources', action: 'delete' },

  // Admins (5)
  { id: 'admins.view', label: 'View Admins', domain: 'admins', action: 'read' },
  { id: 'admins.create', label: 'Create Admins', domain: 'admins', action: 'create' },
  { id: 'admins.edit', label: 'Edit Admin Permissions', domain: 'admins', action: 'update' },
  { id: 'admins.suspend', label: 'Suspend Admins', domain: 'admins', action: 'delete' },
  { id: 'admins.delete', label: 'Delete Admins', domain: 'admins', action: 'delete' },
] as const;

export type PermissionId = (typeof ADMIN_PERMISSIONS)[number]['id'];
