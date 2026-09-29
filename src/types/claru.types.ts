export type ClaruFileType = 'video' | 'inputs' | 'frames' | 'video_right' | 'calibration' | 'other';

export type ClaruSubmissionState =
  | 'draft'
  | 'processing'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'refused'
  | 'expired';

export interface ClaruProjectCategory {
  code: string;
  name: string;
  parent?: { id: string; name: string } | null;
}

export interface ClaruProject {
  id: string;
  name: string;
  checkGroups: {
    video: 'warn' | 'error';
    imu: 'off' | 'warn' | 'error';
    stereo: 'off' | 'error';
  };
  imuExpected: boolean;
  captureAspectRatio: string;
  expectedFiles: Array<{ fileType: ClaruFileType; required: boolean }>;
  clipLength: { minSeconds: number; maxSeconds: number };
  categories: ClaruProjectCategory[];
  contractVersion: number;
}

export interface ClaruDiscovery {
  team: {
    id?: string;
    name?: string;
    status?: string;
    blocked?: { code: string; remedy: string };
  };
  contract: { version: number; minAcceptedVersion: number };
  rateLimit: { requestsPerMinute: number };
  projects: ClaruProject[];
}

export interface ClaruBatchDefaults {
  country?: string;
  collectorId?: string;
  siteId?: string;
  device?: string;
  mount?: string;
}

export interface ClaruBatch {
  id: string;
  name: string;
  projectId: string;
  projectName: string | null;
  batchRef: string | null;
  defaults: ClaruBatchDefaults | null;
  submissionCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaruBatchCreateInput {
  name: string;
  projectId: string;
  projectName?: string;
  batchRef?: string;
  defaults?: ClaruBatchDefaults;
}

export interface ClaruBatchListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  projectId?: string;
}

export interface ClaruPage<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ClaruConsent {
  worker_consent_obtained: true;
  site_or_employer_permission_obtained: true;
  required_consent_or_notice_process_followed: true;
  footage_unedited: true;
}

export interface ClaruDeclaration {
  categoryCode?: string;
  country: string;
  collectorId: string;
  siteId: string;
  device: string;
  mount: string;
  recordedAt: string;
  durationSeconds: number;
  consent: ClaruConsent;
  imu?: { axisConvention: string; videoStartUs?: number | null };
  batchRef?: string;
}

export interface ClaruSubmissionPartInput {
  clientPartId: string;
  fileType: ClaruFileType;
  fileName: string;
  byteSize: string;
}

export interface ClaruSubmissionCreateInput {
  batchId: string;
  externalRef: string;
  declared: ClaruDeclaration;
  parts: ClaruSubmissionPartInput[];
}

export interface ClaruUploadedPartCheckpoint {
  partNumber: number;
  etag: string;
}

export interface ClaruStoredPart {
  id: string;
  clientPartId: string;
  claruPartId: string | null;
  fileType: ClaruFileType;
  fileName: string;
  byteSize: string;
  uploadState: 'pending' | 'uploaded';
  uploadKind: 'put' | 'multipart' | null;
  partSizeBytes: string | null;
  uploadedParts: ClaruUploadedPartCheckpoint[];
  uploadExpiresAt: string | null;
  completedAt: string | null;
}

export interface ClaruSubmission {
  id: string;
  batchId: string;
  externalRef: string;
  claruSubmissionId: string | null;
  projectId: string;
  contractVersion: number;
  declared: ClaruDeclaration;
  state: ClaruSubmissionState;
  sealed: boolean;
  annotationId: string | null;
  seal: unknown | null;
  lastRefusal: {
    code: string;
    message: string;
    details: unknown | null;
    at: string | null;
  } | null;
  rejection: {
    code: string;
    type: string | null;
    reason: string;
    checks: string[];
  } | null;
  version: number;
  sealedAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  parts: ClaruStoredPart[];
}

export type ClaruUploadInstruction =
  | {
      kind: 'put';
      url: string;
      headers: Record<string, string>;
      expiresAt: string;
    }
  | {
      kind: 'multipart';
      uploadId: string;
      partSizeBytes: number;
      parts: Array<{ partNumber: number; url: string }>;
      headers: Record<string, string>;
      expiresAt: string;
    };

export interface ClaruPartUploadInstruction {
  localPartId: string;
  claruPartId: string;
  fileType: ClaruFileType;
  fileName: string;
  byteSize: string;
  uploadState: 'pending' | 'uploaded';
  upload: ClaruUploadInstruction | null;
  /** Authenticated backend transport for storage that does not allow our browser origin. */
  relay?: { generation: string; expiresAt: string };
}

export interface ClaruSubmissionCreateResult {
  submission: ClaruSubmission;
  uploadInstructions: ClaruPartUploadInstruction[];
}

export interface ClaruSubmissionListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  batchId?: string;
  projectId?: string;
  state?: ClaruSubmissionState;
}
