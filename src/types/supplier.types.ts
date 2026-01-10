/**
 * Supplier Types
 */

export type SupplierStatus = 'verified' | 'pending' | 'suspended' | 'rejected';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  company: string;
  status: SupplierStatus;
  verifiedAt?: string;
  createdAt: string;
  datasetsCount: number;
  approvedDatasetsCount: number;
  rating?: number;
  phone?: string;
  address?: string;
  website?: string;
  bio?: string;
}

export interface SupplierVerification {
  supplierId: string;
  verifiedBy: string;
  verifiedAt: string;
  documents: string[];
  notes?: string;
}

// ============================================
// Supplier Invite Types
// ============================================

export type SupplierInviteType = 'INDIVIDUAL' | 'COMPANY';

export interface SupplierInvite {
  id: string;
  email: string;
  supplierInviteType: SupplierInviteType;
  individualName?: string;
  companyName?: string;
  contactPersonName?: string;
  createdBy: string;
  createdAt: string;
  sentAt: string;
  sendCount: number;
}

export interface CreateSupplierInviteRequest {
  email: string;
  supplierInviteType: SupplierInviteType;
  individualName?: string;
  companyName?: string;
  contactPersonName?: string;
  sendEmail?: boolean;
}

export interface SupplierInviteResponse {
  invite: SupplierInvite;
}
