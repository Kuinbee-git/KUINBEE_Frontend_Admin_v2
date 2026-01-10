"use client";

import { useRouter } from "next/navigation";
import { SupplierHeader } from "./SupplierHeader";
import { SupplierIdentityContact } from "./SupplierIdentityContact";
import { SupplierBusinessContext } from "./SupplierBusinessContext";
import { SupplierKYCStatus } from "./SupplierKYCStatus";
import { SupplierDatasetActivity } from "./SupplierDatasetActivity";
import { SupplierAuditEvents } from "./SupplierAuditEvents";

type KYCStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired";

type DatasetStatus =
  | "pending_verification"
  | "under_review"
  | "changes_requested"
  | "published"
  | "rejected"
  | "approved"
  | "draft";

interface SupplierDetailData {
  id: string;
  name: string;
  type: "individual" | "company";
  kycStatus: KYCStatus;
  createdDate: string;
  
  contactPerson: {
    fullName: string;
    position?: string;
    email: string;
    phone: string;
  };
  emailVerified: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  businessDomains: string[];
  natureOfData?: string;
  website?: string;
  description?: string;
  
  kycProvider: string;
  kycSubmittedDate?: string;
  kycApprovedDate?: string;
  kycExpiryDate?: string;
  kycChecks: Array<{
    id: string;
    name: string;
    status: "passed" | "failed" | "pending";
    completedDate?: string;
    notes?: string;
  }>;
  
  datasets: Array<{
    id: string;
    name: string;
    category: string;
    status: DatasetStatus;
    lastUpdated: string;
    createdDate: string;
  }>;
  
  auditEvents: Array<{
    id: string;
    timestamp: string;
    performedBy: string;
    eventType:
      | "profile_created"
      | "profile_updated"
      | "kyc_submitted"
      | "kyc_approved"
      | "kyc_rejected"
      | "dataset_uploaded"
      | "dataset_approved"
      | "dataset_rejected"
      | "account_suspended"
      | "account_reactivated";
    description: string;
    metadata?: Record<string, string | number | boolean | null>;
  }>;
}

interface SupplierDetailProps {
  supplierId: string;
}

// Mock data generator
const getMockSupplierData = (supplierId: string): SupplierDetailData => {
  return {
    id: supplierId,
    name: "DataCorp International",
    type: "company",
    kycStatus: "approved",
    createdDate: "2024-01-15T10:00:00Z",
    
    contactPerson: {
      fullName: "Sarah Johnson",
      position: "Chief Data Officer",
      email: "sarah.johnson@datacorp.com",
      phone: "+1 (555) 123-4567",
    },
    emailVerified: true,
    emergencyContact: {
      name: "Michael Thompson",
      relationship: "Business Partner",
      phone: "+1 (555) 987-6543",
    },
    
    businessDomains: ["Supply Chain", "Logistics", "Manufacturing"],
    natureOfData: "Commercial supply chain and logistics data including shipment tracking, inventory levels, and delivery metrics.",
    website: "https://www.datacorp.com",
    description: "Leading provider of supply chain analytics and data solutions for manufacturing and logistics industries. Specializing in real-time tracking and predictive analytics.",
    
    kycProvider: "Stripe Identity",
    kycSubmittedDate: "2024-01-16T14:30:00Z",
    kycApprovedDate: "2024-01-18T09:15:00Z",
    kycExpiryDate: "2025-01-18T09:15:00Z",
    kycChecks: [
      {
        id: "kyc-1",
        name: "Identity Verification",
        status: "passed",
        completedDate: "2024-01-16T15:00:00Z",
        notes: "Government-issued ID verified",
      },
      {
        id: "kyc-2",
        name: "Business Registration",
        status: "passed",
        completedDate: "2024-01-17T10:30:00Z",
        notes: "Company registration confirmed",
      },
      {
        id: "kyc-3",
        name: "Address Verification",
        status: "passed",
        completedDate: "2024-01-17T16:45:00Z",
      },
      {
        id: "kyc-4",
        name: "Financial Sanctions Check",
        status: "passed",
        completedDate: "2024-01-18T09:00:00Z",
      },
    ],
    
    datasets: [
      {
        id: "DS-2024-1234",
        name: "Global Supply Chain Metrics Q4 2024",
        category: "Supply Chain",
        status: "published",
        lastUpdated: "2 hours ago",
        createdDate: "2024-12-20T08:00:00Z",
      },
      {
        id: "DS-2024-1156",
        name: "Manufacturing Output Data 2024",
        category: "Manufacturing",
        status: "approved",
        lastUpdated: "1 day ago",
        createdDate: "2024-11-15T10:30:00Z",
      },
      {
        id: "DS-2024-1089",
        name: "Logistics Performance Indicators",
        category: "Logistics",
        status: "under_review",
        lastUpdated: "3 days ago",
        createdDate: "2024-10-22T14:20:00Z",
      },
    ],
    
    auditEvents: [
      {
        id: "audit-1",
        timestamp: "2024-12-20T08:00:00Z",
        performedBy: "Sarah Johnson",
        eventType: "dataset_uploaded",
        description: "Uploaded dataset: Global Supply Chain Metrics Q4 2024",
        metadata: { datasetId: "DS-2024-1234" },
      },
      {
        id: "audit-2",
        timestamp: "2024-11-16T11:30:00Z",
        performedBy: "Admin: John Smith",
        eventType: "dataset_approved",
        description: "Approved dataset: Manufacturing Output Data 2024",
        metadata: { datasetId: "DS-2024-1156" },
      },
      {
        id: "audit-3",
        timestamp: "2024-01-18T09:15:00Z",
        performedBy: "System",
        eventType: "kyc_approved",
        description: "KYC verification approved by Stripe Identity",
      },
      {
        id: "audit-4",
        timestamp: "2024-01-16T14:30:00Z",
        performedBy: "Sarah Johnson",
        eventType: "kyc_submitted",
        description: "Submitted KYC documents for verification",
      },
      {
        id: "audit-5",
        timestamp: "2024-01-15T10:00:00Z",
        performedBy: "System",
        eventType: "profile_created",
        description: "Supplier profile created",
      },
    ],
  };
};

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const router = useRouter();
  
  // In real app, fetch data based on supplierId
  const supplier = getMockSupplierData(supplierId);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Header */}
      <SupplierHeader
        supplierId={supplier.id}
        supplierName={supplier.name}
        supplierType={supplier.type}
        kycStatus={supplier.kycStatus}
        createdDate={supplier.createdDate}
        onBack={() => router.push("/dashboard/suppliers")}
      />

      {/* Content Grid */}
      <div className="p-6 space-y-6">
        {/* Two-column layout for primary info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SupplierIdentityContact
            contactPerson={supplier.contactPerson}
            emailVerified={supplier.emailVerified}
            emergencyContact={supplier.emergencyContact}
          />
          
          <SupplierBusinessContext
            businessDomains={supplier.businessDomains}
            natureOfData={supplier.natureOfData}
            website={supplier.website}
            description={supplier.description}
          />
        </div>

        {/* Full-width sections */}
        <SupplierKYCStatus
          kycProvider={supplier.kycProvider}
          kycStatus={supplier.kycStatus}
          kycSubmittedDate={supplier.kycSubmittedDate}
          kycApprovedDate={supplier.kycApprovedDate}
          kycExpiryDate={supplier.kycExpiryDate}
          checks={supplier.kycChecks}
        />

        <SupplierDatasetActivity datasets={supplier.datasets} />

        <SupplierAuditEvents auditEvents={supplier.auditEvents} />
      </div>
    </div>
  );
}
