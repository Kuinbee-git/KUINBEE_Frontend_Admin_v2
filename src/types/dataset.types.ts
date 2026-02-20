/**
 * Dataset Types
 * Matches backend /api/v1/admin/datasets/* responses
 */

// ============================================
// Enums
// ============================================

export type DatasetStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REJECTED'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type VerificationStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type DatasetVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export type OwnerType = 'PLATFORM' | 'SUPPLIER';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type UploadScope = 'FINAL' | 'VERIFICATION';

export type UploadStatus = 'UPLOADING' | 'UPLOADED' | 'FAILED' | 'PROMOTED';

export type AssignmentStatus = 'ACTIVE' | 'REASSIGNED' | 'COMPLETED' | 'CANCELLED';

// ============================================
// Dataset Entity
// ============================================

export interface Dataset {
  id: string;
  datasetUniqueId: string;
  title: string;
  ownerType: OwnerType;
  ownerId: string;
  status: DatasetStatus;
  visibility: DatasetVisibility;
  superType: string;
  primaryCategoryId: string;
  sourceId: string;
  isPaid: boolean;
  price: string | null;
  currency: Currency;
  license: string;
  downloadCount: number;
  viewCount: number;
  rating: string | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  publishedUploadId: string | null;
  pricing?: DatasetPricingDto;
}

// ============================================
// Dataset Metadata
// ============================================

export interface AboutDatasetInfo {
  overview: string;
  description: string;
  dataQuality: string;
  useCases: string | null;
  limitations: string | null;
  methodology: string | null;
}

export interface LocationInfo {
  country: string;
  state: string | null;
  city: string | null;
  region: string | null;
  coordinates: string | null;
  coverage: string | null;
}

export interface DataFormatInfo {
  fileFormat: string;
  rows: number;
  cols: number;
  fileSize: string;
  compressionType: string;
  encoding: string;
}

export interface DatasetFeature {
  id: string;
  name: string;
  dataType: string;
  description: string | null;
  isNullable: boolean;
}

export interface DatasetTag {
  id: string;
  name: string;
  slug: string;
}

// ============================================
// Dataset Verification
// ============================================

export interface DatasetVerification {
  id: string;
  datasetId: string;
  status: VerificationStatus;
  currentUploadId: string | null;
  notes: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dataset Assignment
// ============================================

export interface DatasetAssignment {
  id: string;
  datasetId: string;
  adminId: string;
  assignedBy: string;
  status: AssignmentStatus;
  assignedAt: string;
  completedAt: string | null;
  notes: string | null;
}

// ============================================
// Dataset Upload
// ============================================

export interface DatasetUpload {
  id: string;
  datasetId: string;
  scope: UploadScope;
  status: UploadStatus;
  s3Key: string;
  originalFileName: string | null;
  contentType: string | null;
  sizeBytes: string | null;
  uploadedAt: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Request Types
// ============================================

export interface CreateDatasetRequest {
  title: string;
  visibility?: DatasetVisibility;
  superType: string;
  primaryCategoryId: string;
  sourceId: string;
  isPaid?: boolean;
  price?: string | null;
  currency?: Currency;
  license: string;
  aboutDatasetInfo?: {
    overview: string;
    description: string;
    dataQuality: string;
    useCases?: string | null;
    limitations?: string | null;
    methodology?: string | null;
  };
  locationInfo?: {
    country: string;
    state?: string | null;
    city?: string | null;
    region?: string | null;
    coordinates?: string | null;
    coverage?: string | null;
  };
}

export interface UpdateDatasetRequest {
  title?: string;
  visibility?: DatasetVisibility;
  superType?: string;
  primaryCategoryId?: string;
  sourceId?: string;
  isPaid?: boolean;
  price?: string | null;
  currency?: Currency;
  license?: string;
}

export interface UpdateDatasetMetadataRequest {
  aboutDatasetInfo?: Partial<AboutDatasetInfo>;
  dataFormatInfo?: Partial<DataFormatInfo>;
  locationInfo?: Partial<LocationInfo>;
  features?: Array<{
    name: string;
    dataType: string;
    description?: string | null;
    isNullable?: boolean;
  }>;
  tags?: string[];
}

export interface StartUploadRequest {
  scope?: UploadScope;
  originalFileName?: string;
  contentType?: string;
  sizeBytes?: string;
}

export interface CompleteUploadRequest {
  etag?: string;
  checksumSha256?: string;
  sizeBytes?: string;
}

export interface PublishDatasetRequest {
  uploadId: string;
}

export interface RejectProposalRequest {
  rejectionReason: string;
  notes?: string;
}

// ============================================
// Pricing Request/Response Types
// ============================================

export interface DatasetPricingDto {
  id: string;
  datasetId: string;
  isPaid: boolean;
  price: string | null;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  status: 'SUBMITTED' | 'CHANGES_REQUESTED' | 'ACTIVE' | 'REJECTED' | 'VERIFIED';
  submittedAt: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  changeRationale?: string | null;
  datasetNeedsChanges?: boolean;
  pricingNeedsChanges?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequestChangesRequest {
  notes?: string;
  changeRationale?: string;
  datasetNeedsChanges?: boolean;
  pricingNeedsChanges?: boolean;
}

export interface ApproveProposalRequest {
  notes?: string;
}

// ============================================
// Response Types
// ============================================

export interface DatasetListItem {
  dataset: Dataset;
  primaryCategory?: {
    id: string;
    name: string;
  };
  source?: {
    id: string;
    name: string;
    description: string | null;
    websiteUrl: string | null;
    isVerified: boolean;
  };
}

export interface DatasetDetailResponse {
  dataset: Dataset;
  primaryCategory: {
    id: string;
    name: string;
  };
  source: {
    id: string;
    name: string;
    description: string | null;
    websiteUrl: string | null;
    isVerified: boolean;
  };
  aboutDatasetInfo: AboutDatasetInfo | null;
  locationInfo: LocationInfo | null;
  dataFormatInfo: DataFormatInfo | null;
  features: DatasetFeature[];
  publishedUpload: DatasetUpload | null;
  tags: DatasetTag[];
}

export interface DatasetProposalListItem {
  dataset: {
    id: string;
    datasetUniqueId: string;
    title: string;
    ownerType: OwnerType;
    ownerId: string;
    status: DatasetStatus;
    superType: string;
    primaryCategoryId: string;
    sourceId: string;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
  };
  verification: DatasetVerification | null;
  activeAssignment: DatasetAssignment | null;
}

export interface AssignedDatasetListItem {
  assignment: DatasetAssignment;
  dataset: {
    id: string;
    datasetUniqueId: string;
    title: string;
    status: DatasetStatus;
    ownerType: OwnerType;
  };
  verification: DatasetVerification | null;
}

export interface StartUploadResponse {
  upload: DatasetUpload;
  presignedUpload: {
    url: string;
    expiresAt: string;
    method: string;
    headers?: Record<string, string>;
  };
}

export interface DownloadUrlResponse {
  url: string;
  expiresAt: string;
  upload: {
    id: string;
    originalFileName: string | null;
    contentType: string | null;
    sizeBytes: string | null;
  };
}

export interface ProposalReviewResponse {
  dataset: Dataset;
  verification: {
    id: string;
    status: VerificationStatus;
    currentUploadId: string | null;
    currentUpload: DatasetUpload | null;
    rejectionReason: string | null;
    notes: string | null;
    verifiedBy: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
    rejectedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  activeAssignment: DatasetAssignment | null;
  aboutDatasetInfo: AboutDatasetInfo | null;
  dataFormatInfo: DataFormatInfo | null;
  features: DatasetFeature[];
  primaryCategory: {
    id: string;
    name: string;
    createdAt: string;
    createdBy: string;
  };
  secondaryCategories: Array<{
    id: string;
    name: string;
  }>;
  source: {
    id: string;
    name: string;
    description: string | null;
    websiteUrl: string | null;
    createdBy: string;
    createdByType: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

// ============================================
// Legacy Types (for UI compatibility)
// ============================================

/** @deprecated Use DatasetStatus instead */
export type LegacyDatasetStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'under_review'
  | 'revision_required';

/** @deprecated */
export interface DatasetReview {
  id: string;
  datasetId: string;
  reviewerId: string;
  reviewerName: string;
  action: 'approve' | 'reject';
  comments: string;
  timestamp: string;
}

/** @deprecated */
export interface DatasetQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  overall: number;
}
