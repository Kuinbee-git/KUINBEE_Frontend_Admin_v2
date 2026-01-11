/**
 * Supplier Types
 */

// Supplier List Item (for directory view)
export interface SupplierListItem {
  supplier: {
    id: string;
    email: string;
    phone: string | null;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED";
    createdAt: string; // ISO
    updatedAt: string; // ISO
  };
  supplierProfile: {
    supplierType: "INDIVIDUAL" | "COMPANY";
    companyName: string | null;
    websiteUrl: string | null;
    individualName: string | null;
    contactPersonName: string;
    designation: string | null;
    contactEmail: string;
    contactEmailVerified: boolean;
    businessDomains: string[];
    primaryDomain: string | null;
    naturesOfDataProvided: string | null;
    createdAt: string; // ISO
    updatedAt: string; // ISO
  };
  kyc: {
    provider: "SIGNZY";
    status: "PENDING" | "IN_PROGRESS" | "VERIFIED" | "REJECTED" | "FAILED";
  } | null;
}

// Supplier Detail (for individual supplier page)
export interface SupplierDetail {
  supplier: {
    id: string;
    email: string;
    phone: string | null;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED";
    emailVerified: boolean;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    lastLoginAt: string | null; // ISO
    deletedAt: string | null;   // ISO
  };
  supplierProfile: {
    supplierType: "INDIVIDUAL" | "COMPANY";
    companyName: string | null;
    websiteUrl: string | null;
    individualName: string | null;
    contactPersonName: string;
    designation: string | null;
    contactEmail: string;
    contactEmailVerified: boolean;
    contactEmailVerifiedAt: string | null; // ISO
    businessDomains: string[];
    primaryDomain: string | null;
    naturesOfDataProvided: string | null;
    createdAt: string; // ISO
    updatedAt: string; // ISO
  };
  kyc: {
    id: string;
    provider: "SIGNZY";
    status: "PENDING" | "IN_PROGRESS" | "VERIFIED" | "REJECTED" | "FAILED";
    failureReason: string | null;
    createdAt: string; // ISO
    updatedAt: string; // ISO
  } | null;
}

// Supplier Analytics
export interface SupplierAnalytics {
  supplierId: string;
  windowDays: number;
  totals: {
    datasetCount: number;
    publishedDatasetCount: number;
    orderCount: number;
    revenue: string; // decimal string
    downloadCount: number;
  };
}

// Supplier KYC Details
export interface SupplierKyc {
  supplierId: string;
  kyc: {
    id: string;
    provider: "SIGNZY";
    status: "PENDING" | "IN_PROGRESS" | "VERIFIED" | "REJECTED" | "FAILED";
    failureReason: string | null;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    checks: Array<{
      id: string;
      checkType: "AADHAAR" | "PAN" | "COMPANY_PAN" | "GSTIN" | "CIN";
      status: "PENDING" | "SUBMITTED" | "IN_PROGRESS" | "VERIFIED" | "REJECTED" | "FAILED";
      valueMasked: string;
      providerRequestId: string | null;
      providerReferenceId: string | null;
      submittedAt: string | null; // ISO
      verifiedAt: string | null;  // ISO
      createdAt: string; // ISO
      updatedAt: string; // ISO
    }>;
  } | null;
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
