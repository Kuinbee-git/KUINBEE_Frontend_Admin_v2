import { z } from "zod";
import type {
  SupplierIdentity,
  SupplierCapabilities,
  SupplierWorkspaceDto,
} from "./supplier-onboarding-contracts";

export const SupplierDirectoryQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  stage: z
    .enum([
      "ALL",
      "NEEDS_REVIEW",
      "INVITED",
      "WAITING_FOR_SUPPLIER",
      "APPROVED",
      "REJECTED",
    ])
    .default("ALL"),
  supplierType: z.enum(["ALL", "INDIVIDUAL", "COMPANY"]).default("ALL"),
  country: z.string().trim().max(100).default(""),
  domain: z.string().trim().max(160).default(""),
  modality: z.string().trim().max(160).default(""),
  format: z.string().trim().max(160).default(""),
  accountStatus: z
    .enum([
      "ALL",
      "NO_ACCOUNT",
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
      "PENDING_VERIFICATION",
      "DELETED",
    ])
    .default("ALL"),
  contract: z.enum(["ALL", "COMPLETE", "PENDING"]).default("ALL"),
  sort: z
    .enum(["updatedAt:desc", "createdAt:desc", "name:asc"])
    .default("updatedAt:desc"),
});
export type SupplierDirectoryQuery = z.infer<
  typeof SupplierDirectoryQuerySchema
>;
export const SupplierAdminNoteSchema = z
  .object({ body: z.string().trim().min(3).max(5000) })
  .strict();
export const SupplierEvidenceMetadataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .refine(
      (v) =>
        !v.includes("/") &&
        !v.includes("\\") &&
        ![...v].some((c) => c.charCodeAt(0) < 32),
      "Use a valid file name",
    ),
  summary: z.string().trim().min(3).max(500),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Use an http or https reference",
    )
    .default(""),
});
export interface SupplierDirectoryItem {
  recordId: string;
  applicationId: string | null;
  supplierId: string | null;
  name: string;
  email: string;
  supplierType: string;
  country: string | null;
  logoUrl: string | null;
  domains: string[];
  offerings: string[];
  stage: string;
  accountStatus: string | null;
  verificationStatus: string | null;
  contractComplete: boolean | null;
  reviewer: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}
export interface SupplierDirectoryResponse {
  items: SupplierDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
}
export interface SupplierAdminEntryDto {
  id: string;
  kind: string;
  body: string;
  name: string | null;
  sourceUrl: string | null;
  contentType: string | null;
  size: number | null;
  sha256: string | null;
  createdAt: string;
  author: { id: string; name: string };
}
export interface SupplierAdminWorkspace {
  record: SupplierDirectoryItem;
  identity: SupplierIdentity;
  approvedIdentity: SupplierIdentity | null;
  capabilities: SupplierCapabilities;
  account: {
    id: string;
    email: string;
    phone: string | null;
    emailVerified: boolean;
    contactEmail: string | null;
    contactEmailVerified: boolean;
    emergencyContact: string | null;
    lastLoginAt: string | null;
    onboardingCompletedAt: string | null;
  } | null;
  source: {
    source: string | null;
    requirementRef: string | null;
    importRef: string | null;
    createdAt: string;
  };
  review: SupplierWorkspaceDto | null;
  reviewActors: Record<string, { id: string; name: string }>;
  contract: {
    complete: boolean;
    completedAt: string | null;
    completedBy: { id: string; name: string } | null;
  } | null;
  legacyKyc: {
    status: string;
    provider: string;
    failureReason: string | null;
    updatedAt: string;
    checks: {
      id: string;
      checkType: string;
      status: string;
      valueMasked: string;
      submittedAt: string | null;
      verifiedAt: string | null;
    }[];
  } | null;
  legacyManualKyc: {
    status: string;
    submittedAt: string;
    verifiedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    reviewer: { id: string; name: string } | null;
  } | null;
  entries: SupplierAdminEntryDto[];
  entriesTotal: number;
  activity: {
    id: string;
    action: string;
    createdAt: string;
    actor: { id: string; name: string };
    description: string;
  }[];
  marketplace: {
    datasetCount: number;
    publishedDatasetCount: number;
    serviceCount: number;
    datasets: { id: string; title: string; status: string }[];
    services: { id: string; title: string; status: string }[];
  } | null;
  permissions: { review: boolean; invite: boolean; analytics: boolean };
}

export interface SupplierInvitationHistoryItem {
  id: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  state: string;
  createdBy: { id: string; name: string } | null;
}
