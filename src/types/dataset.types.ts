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
  | 'DELISTED'
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

type OwnerType = 'PLATFORM' | 'SUPPLIER';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type DatasetSuperType =
  | 'CROSS_SECTIONAL'
  | 'TIME_SERIES'
  | 'PANEL'
  | 'POOLED_CROSS_SECTIONAL'
  | 'REPEATED_CROSS_SECTIONS'
  | 'SPATIAL'
  | 'SPATIO_TEMPORAL'
  | 'EXPERIMENTAL'
  | 'OBSERVATIONAL'
  | 'BIG_DATA'
  | 'EVENT_HISTORY_SURVIVAL'
  | 'HIERARCHICAL_MULTILEVEL';

export type FileFormat =
  | 'CSV'
  | 'JSON'
  | 'EXCEL'
  | 'PARQUET'
  | 'SQL'
  | 'XML'
  | 'TSV'
  | 'AVRO'
  | 'HDF5'
  | 'PICKLE'
  | 'FEATHER'
  | 'OTHER';

export type CompressionType = 'NONE' | 'ZIP' | 'GZIP' | 'BZIP2' | 'TAR' | 'RAR';

export type EncodingType =
  | 'UTF-8'
  | 'UTF-16'
  | 'UTF-16LE'
  | 'UTF-16BE'
  | 'UTF-32'
  | 'ASCII'
  | 'ISO-8859-1'
  | 'WINDOWS-1252'
  | 'SHIFT_JIS'
  | 'GB18030';

export const ENCODING_TYPES: readonly EncodingType[] = [
  'UTF-8',
  'UTF-16',
  'UTF-16LE',
  'UTF-16BE',
  'UTF-32',
  'ASCII',
  'ISO-8859-1',
  'WINDOWS-1252',
  'SHIFT_JIS',
  'GB18030',
];

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
  superType: DatasetSuperType;
  primaryCategoryId: string;
  sourceId: string;
  license: string;
  downloadCount: number;
  viewCount: number;
  rating: string | null;
  reviewCount: number;
  isSample?: boolean;
  sampleNotes?: {
    whySample: string;
    actualDataSize: string;
    completeness?: string;
    deliveryMechanism: 'API' | 'FILE' | 'OTHER';
    deliveryMechanismNotes?: string;
  } | null;
  actualPrice?: number | null;
  actualPriceCurrency?: string | null;
  isNegotiable?: boolean | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  publishedUploadId: string | null;
  pricing?: DatasetPricingDto | null;
}

// ============================================
// Dataset Metadata
// ============================================

interface AboutDatasetInfo {
  overview: string;
  description: string;
  dataQuality: string;
  useCases: string | null;
  limitations: string | null;
  methodology: string | null;
}

interface LocationInfo {
  country: string;
  state: string | null;
  city: string | null;
  region: string | null;
  coordinates: string | null;
  coverage: string | null;
}

interface DataFormatInfo {
  fileFormat: FileFormat;
  rows: number;
  cols: number;
  fileSize: string;
  compressionType: CompressionType;
  encoding: EncodingType;
}

interface DatasetFeature {
  id: string;
  name: string;
  dataType: string;
  description: string | null;
  isNullable: boolean;
}

interface DatasetTag {
  id: string;
  name: string;
  slug: string;
}

// ============================================
// Dataset Verification
// ============================================

interface DatasetVerification {
  id: string;
  datasetId: string;
  status: VerificationStatus;
  currentUploadId: string | null;
  notes: string | null;
  rejectionReason: string | null;
  verifiedBy?: string | null;
  verifiedByName?: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dataset Assignment
// ============================================

interface DatasetAssignment {
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
  datasetId?: string;
  scope: UploadScope;
  status: UploadStatus;
  s3Key: string;
  originalFileName?: string | null;
  contentType?: string | null;
  sizeBytes: string | null;
  etag?: string | null;
  checksumSha256?: string | null;
  uploadedAt?: string | null;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Request Types
// ============================================

export interface CreateDatasetRequest {
  title: string;
  visibility?: DatasetVisibility;
  superType: DatasetSuperType;
  primaryCategoryId: string;
  sourceId: string;
  pricing?: {
    isPaid: boolean;
    price?: string | null;
    currency?: Currency;
  };
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
  pricing?: {
    isPaid: boolean;
    price?: string | null;
    currency?: Currency;
  };
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
  sizeBytes?: string;
}

export interface DatasetMetadataUpdateResponse {
  dataset: {
    id: string;
    updatedAt: string;
  };
  aboutDatasetInfo?: AboutDatasetInfo & { updatedAt: string };
  dataFormatInfo?: DataFormatInfo & { updatedAt: string };
  locationInfo?: LocationInfo & { updatedAt: string };
}

export interface PublishDatasetRequest {
  uploadId: string;
}

export interface DatasetActionReasonRequest {
  reason: string;
}

export interface DatasetAuditEvent {
  id: string;
  action: string;
  actor: {
    id: string;
    email: string;
    name: string | null;
  };
  previousStatus: DatasetStatus | null;
  newStatus: DatasetStatus | null;
  summary: string | null;
  createdAt: string;
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
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'CHANGES_REQUESTED'
    | 'RESUBMITTED'
    | 'UNDER_REVIEW'
    | 'ACTIVE'
    | 'REJECTED'
    | 'INACTIVE';
  notes: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  changeRationale: string | null;
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
  owner?: {
    id: string;
    email: string;
    supplierProfile?: {
      companyName: string | null;
      individualName: string | null;
      contactPersonName: string | null;
    };
  };
  assignedAdmin?: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
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
    superType: DatasetSuperType;
    primaryCategoryId: string;
    sourceId: string;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
  };
  supplier?: {
    id: string;
    name: string;
    email: string;
  };
  primaryCategory?: {
    id: string;
    name: string;
  } | null;
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
  };
  supplier: {
    id: string;
    name: string;
    email: string;
  } | null;
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
  supplier: {
    id: string;
    name: string;
    email: string;
  } | null;
  verification: {
    id: string;
    status: VerificationStatus;
    currentUploadId: string | null;
    currentUpload: DatasetUpload | null;
    rejectionReason: string | null;
    notes: string | null;
    verifiedBy: string | null;
    verifiedByName?: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
    rejectedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  activeAssignment: DatasetAssignment | null;
  assignedAdmin: {
    id: string;
    name: string;
    email: string;
  } | null;
  aboutDatasetInfo: AboutDatasetInfo | null;
  locationInfo: LocationInfo | null;
  dataFormatInfo: DataFormatInfo | null;
  features: DatasetFeature[];
  tags: DatasetTag[];
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
  sampleUpload?: DatasetUpload | null;
}

interface DatasetQuestionAnswer {
  id: string;
  answer: string;
  createdAt: string;
}

export interface DatasetQuestion {
  id: string;
  question: string;
  createdAt: string;
  answers: DatasetQuestionAnswer[];
}

export interface DatasetQuestionDataset {
  datasetId: string;
  datasetTitle: string;
  questionCount: number;
}

export interface DatasetQuestionsResponse {
  items: DatasetQuestion[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AnswerQuestionRequest {
  answer: string;
}
