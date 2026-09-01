/**
 * User Types
 * Matches backend /api/v1/admin/users/* responses
 */

import type { UserType, UserStatus } from './auth.types';
import type { AddressType, Gender } from './admin.types';

// ============================================
// Re-export for convenience
// ============================================

export type { UserStatus };

// ============================================
// User List Item (from /admin/users)
// ============================================

export interface UserListItem {
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
  personalInfo: {
    firstName: string;
    lastName: string;
    fullName: string | null;
  } | null;
  organization: string | null;
}

// ============================================
// User Detail Types
// ============================================

interface UserPersonalInfo {
  firstName: string;
  lastName: string;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  profileImage: string | null;
}

interface UserAddress {
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

interface SupplierProfile {
  companyName: string;
  businessType: string | null;
  taxId: string | null;
  businessLicense: string | null;
  website: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  bio: string | null;
  occupation: string | null;
  organization: string | null;
  institution: string | null;
  interestedDomains: string[];
}

// ============================================
// User Detail Response
// ============================================

export interface UserDetailResponse {
  user: {
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
  };
  personalInfo: UserPersonalInfo | null;
  addresses: UserAddress[];
  supplierProfile: SupplierProfile | null;
  userProfile: UserProfile | null;
}

// ============================================
// Request Types
// ============================================

export interface SuspendUserRequest {
  reason: string;
}

export type UnsuspendUserRequest = SuspendUserRequest;

export type DeleteUserRequest = SuspendUserRequest;

// ============================================
// Response Types
// ============================================

export interface SuspendUserResponse {
  user: {
    id: string;
    status: 'SUSPENDED';
    updatedAt: string;
  };
}

export interface UnsuspendUserResponse {
  user: {
    id: string;
    status: 'ACTIVE';
    updatedAt: string;
  };
}

export interface DeleteUserResponse {
  success: true;
  user: {
    id: string;
    status: 'DELETED';
    deletedAt: string;
    updatedAt: string;
  };
}
