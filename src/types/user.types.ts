/**
 * User Types
 * Matches backend /api/v1/admin/users/* responses
 */

import type { UserType, UserStatus } from './auth.types';
import type { AddressType, Gender } from './admin.types';

// ============================================
// Re-export for convenience
// ============================================

export type { UserType, UserStatus };

// ============================================
// Access Type
// ============================================

export type AccessType = 'PURCHASED' | 'FREE' | 'TRIAL' | 'GIFTED';

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
  organization?: string | null;
  datasetsAccessed?: number;
  orders?: number;
}

// ============================================
// User Detail Types
// ============================================

export interface UserPersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  profileImage: string | null;
}

export interface UserAddress {
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

export interface SupplierProfile {
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

export interface UserProfile {
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
// Full User (for mock data and detail views)
// ============================================

export interface DatasetAccess {
  id: string;
  datasetId: string;
  datasetName: string;
  accessType: AccessType;
  grantedAt: string;
  expiresAt: string | null;
  orderReference: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Download {
  id: string;
  datasetId: string;
  datasetName: string;
  downloadedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  reason: string | null;
}

export interface MarketplaceUser {
  id: string;
  email: string;
  phone: string | null;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profile: UserProfile;
  datasetAccess: DatasetAccess[];
  orders: Order[];
  downloads: Download[];
  auditLog: AuditLogEntry[];
}

// ============================================
// Request Types
// ============================================

export interface SuspendUserRequest {
  reason?: string;
}

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

export interface DeleteUserResponse {
  success: true;
  user: {
    id: string;
    status: 'DELETED';
    deletedAt: string;
    updatedAt: string;
  };
}
