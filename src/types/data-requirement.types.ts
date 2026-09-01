export type DataRequirementSource = 'USER_APP' | 'SUPPLIER_PANEL' | 'LEGACY_IMPORT';
export type DataRequirementStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'CLOSED'
  | 'ARCHIVED';

interface DataRequirementListItem {
  id: string;
  referenceCode: string;
  title: string;
  source: DataRequirementSource;
  status: DataRequirementStatus;
  version: number;
  contactName: string;
  organization: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DataRequirementEvent {
  id: string;
  fromStatus: DataRequirementStatus | null;
  toStatus: DataRequirementStatus;
  action: string;
  note: string | null;
  actorType: 'SYSTEM' | 'USER' | 'SUPPLIER' | 'ADMIN';
  actorName: string;
  actorEmail: string;
  createdAt: string;
}

export interface DataRequirementDetail extends DataRequirementListItem {
  slug: string | null;
  contactEmail: string;
  phone: string | null;
  industry: string;
  dataType: string;
  description: string;
  intendedUse: string;
  requestedFormats: string[];
  requestedGeographies: string[];
  requestedLanguages: string[];
  expectedVolume: string | null;
  targetDeliveryDate: string | null;
  budgetRange: string | null;
  licensingCompliance: string | null;
  submitterNotes: string | null;
  originalSubmission: unknown;
  supplierProfileId: string | null;
  submittedByUserId: string | null;
  publicSummary: string | null;
  publicSpecifications: string[];
  publicCoverage: string[];
  publicVolume: string[];
  publicDeliveryDate: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  reviewStartedAt: string | null;
  publishedAt: string | null;
  rejectedAt: string | null;
  closedAt: string | null;
  archivedAt: string | null;
  events: DataRequirementEvent[];
}

export interface DataRequirementListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: DataRequirementStatus;
  source?: DataRequirementSource;
  sort?: 'NEWEST' | 'OLDEST' | 'UPDATED';
}

export interface DataRequirementPage {
  items: DataRequirementListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DataRequirementPatch {
  requirementId: string;
  expectedVersion: number;
  title?: string;
  industry?: string;
  dataType?: string;
  publicSummary?: string | null;
  publicSpecifications?: string[];
  publicCoverage?: string[];
  publicVolume?: string[];
  publicDeliveryDate?: string | null;
  adminNotes?: string | null;
}

export type DataRequirementAction =
  | 'start-review'
  | 'publish'
  | 'unpublish'
  | 'reject'
  | 'close'
  | 'archive';
