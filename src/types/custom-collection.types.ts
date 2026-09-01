export type CustomCollectionRevisionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RESUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED';

export type CustomCollectionLeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFYING'
  | 'WON'
  | 'LOST'
  | 'SPAM';

export type CustomCollectionAssignmentFilter = 'ME' | 'UNASSIGNED' | 'ANY';
export type CustomCollectionAdminView =
  | 'REVIEW_QUEUE'
  | 'PUBLISHED'
  | 'PRIVATE'
  | 'ARCHIVED'
  | 'ALL';

interface CustomCollectionCategory {
  id: string;
  name: string;
}

interface CustomCollectionImage {
  id: string;
  url: string;
  contentType: string;
  sizeBytes: string | null;
}

interface CustomCollectionReviewer {
  id: string;
  email: string;
  displayName: string;
}

export interface CustomCollectionRevision {
  id: string;
  serviceId: string;
  version: number;
  status: CustomCollectionRevisionStatus;
  title: string;
  shortDescription: string;
  description: string;
  primaryCategory: CustomCollectionCategory;
  secondaryCategories: CustomCollectionCategory[];
  collectionMethods: string[];
  collectionMethodsOther: string | null;
  dataTypes: string[];
  dataTypesOther: string | null;
  supportedFormats: string[];
  supportedFormatsOther: string | null;
  industries: string[];
  industriesOther: string | null;
  geographies: string[];
  geographiesOther: string | null;
  languages: string[];
  languagesOther: string | null;
  estimatedTurnaroundMinDays: number;
  estimatedTurnaroundMaxDays: number;
  deliverables: string;
  qualityAssurance: string;
  complianceNotes: string | null;
  coverImage: CustomCollectionImage | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedBy: CustomCollectionReviewer | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCollectionServiceSummary {
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  archivedAt: string | null;
  supplier: {
    id: string;
    displayName: string;
    contactEmail?: string | null;
    logoUrl: string | null;
  };
  publishedRevision: CustomCollectionRevision | null;
  workingRevision: CustomCollectionRevision | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCollectionReviewEvent {
  id: string;
  serviceId: string;
  revisionId: string;
  fromStatus: CustomCollectionRevisionStatus | null;
  toStatus: CustomCollectionRevisionStatus;
  action: string;
  note: string | null;
  actorId: string | null;
  actorNameSnapshot: string;
  actorEmailSnapshot: string;
  actorUserTypeSnapshot: string;
  createdAt: string;
}

export interface CustomCollectionLead {
  id: string;
  serviceId: string;
  serviceRevisionId: string;
  requestedRevisionVersion: number;
  currentRevisionVersion: number | null;
  isRequestedRevisionCurrent: boolean;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  industry: string | null;
  dataDescription: string | null;
  preferredFormat: string | null;
  timeline: string | null;
  additionalNotes: string | null;
  submissionType: 'SIGNED_IN_ONE_TAP' | 'GUEST_FORM';
  status: CustomCollectionLeadStatus;
  createdAt: string;
  updatedAt: string;
}

interface CustomCollectionLeadEvent {
  id: string;
  leadId: string;
  fromStatus: CustomCollectionLeadStatus | null;
  toStatus: CustomCollectionLeadStatus;
  note: string | null;
  actorId: string | null;
  actorNameSnapshot: string;
  actorEmailSnapshot: string;
  actorType: 'SYSTEM' | 'USER' | 'ADMIN';
  createdAt: string;
}

export interface CustomCollectionLeadDetail extends CustomCollectionLead {
  requestedRevision: CustomCollectionRevision;
  currentRevision: CustomCollectionRevision | null;
  events: CustomCollectionLeadEvent[];
}

export interface CustomCollectionListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: CustomCollectionRevisionStatus | 'ALL';
  assignedTo?: CustomCollectionAssignmentFilter;
  supplierId?: string;
  view?: CustomCollectionAdminView;
}

export interface CustomCollectionLeadListParams {
  page?: number;
  pageSize?: number;
  status?: CustomCollectionLeadStatus | 'ALL';
  serviceId?: string;
  supplierId?: string;
}

export interface CustomCollectionPaginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
