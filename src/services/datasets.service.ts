/**
 * Datasets Service
 * API calls for dataset management (admin functionality)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  Dataset,
  DatasetStatus,
  DatasetVisibility,
  OwnerType,
  DatasetListItem,
  DatasetDetailResponse,
  DatasetProposalListItem,
  AssignedDatasetListItem,
  DatasetUpload,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  UpdateDatasetMetadataRequest,
  StartUploadRequest,
  StartUploadResponse,
  CompleteUploadRequest,
  DownloadUrlResponse,
  PublishDatasetRequest,
  ApproveProposalRequest,
  RejectProposalRequest,
  RequestChangesRequest,
  ProposalReviewResponse,
  VerificationStatus,
  AssignmentStatus,
  UploadScope,
  UploadStatus,
  PaginatedResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface DatasetListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: DatasetStatus | 'ALL';
  visibility?: DatasetVisibility | 'ALL';
  ownerType?: OwnerType | 'ALL';
  primaryCategoryId?: string;
  sourceId?: string;
  isPaid?: boolean;
  sort?: string;
}

export interface DatasetProposalParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: DatasetStatus | 'ALL';
  verificationStatus?: VerificationStatus | 'ALL';
  assignedTo?: 'ME' | 'ANY' | 'UNASSIGNED';
  sort?: string;
}

export interface AssignedDatasetParams {
  page?: number;
  pageSize?: number;
  status?: AssignmentStatus | 'ALL';
  sort?: string;
}

export interface UploadListParams {
  page?: number;
  pageSize?: number;
  scope?: UploadScope | 'ALL';
  status?: UploadStatus | 'ALL';
}

// ============================================
// Platform Datasets (Stage 4)
// ============================================

/**
 * Get paginated list of datasets
 */
export async function getDatasets(
  params: DatasetListParams = {}
): Promise<PaginatedResponse<DatasetListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<any>(
    `${API_ROUTES.ADMIN.DATASETS.LIST}${query}`
  );
  
  // API returns: { success: true, data: { items, page, pageSize, total } }
  const apiData = response.data?.data || response.data;
  
  return {
    items: apiData.items || [],
    pagination: {
      page: apiData.page || 1,
      pageSize: apiData.pageSize || 50,
      total: apiData.total || 0,
      totalPages: Math.ceil((apiData.total || 0) / (apiData.pageSize || 50)),
    },
  };
}

/**
 * Get dataset detail by ID
 */
export async function getDatasetById(datasetId: string): Promise<DatasetDetailResponse> {
  const response = await apiClient.get<DatasetDetailResponse>(
    API_ROUTES.ADMIN.DATASETS.DETAIL(datasetId)
  );
  return response.data;
}

/**
 * Create a new platform dataset
 */
export async function createDataset(data: CreateDatasetRequest): Promise<Dataset> {
  const response = await apiClient.post<{ dataset: Dataset }>(
    API_ROUTES.ADMIN.DATASETS.CREATE,
    data
  );
  return response.data.dataset;
}

/**
 * Update dataset basic info
 */
export async function updateDataset(
  datasetId: string,
  data: UpdateDatasetRequest
): Promise<Dataset> {
  const response = await apiClient.patch<{ dataset: Dataset }>(
    API_ROUTES.ADMIN.DATASETS.UPDATE(datasetId),
    data
  );
  return response.data.dataset;
}

/**
 * Update dataset metadata (about, location, format, features, tags)
 */
export async function updateDatasetMetadata(
  datasetId: string,
  data: UpdateDatasetMetadataRequest
): Promise<DatasetDetailResponse> {
  const response = await apiClient.patch<DatasetDetailResponse>(
    API_ROUTES.ADMIN.DATASETS.METADATA(datasetId),
    data
  );
  return response.data;
}

/**
 * Delete a dataset
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.DATASETS.DELETE(datasetId));
}

/**
 * Publish a dataset with specified upload
 */
export async function publishDataset(
  datasetId: string,
  data: PublishDatasetRequest
): Promise<Dataset> {
  const response = await apiClient.post<{ dataset: Dataset }>(
    API_ROUTES.ADMIN.DATASETS.PUBLISH(datasetId),
    data
  );
  return response.data.dataset;
}

/**
 * Unpublish a dataset
 */
export async function unpublishDataset(datasetId: string): Promise<Dataset> {
  const response = await apiClient.post<{ dataset: Dataset }>(
    API_ROUTES.ADMIN.DATASETS.UNPUBLISH(datasetId)
  );
  return response.data.dataset;
}

// ============================================
// Dataset Uploads
// ============================================

/**
 * Get list of uploads for a dataset
 */
export async function getDatasetUploads(
  datasetId: string,
  params: UploadListParams = {}
): Promise<PaginatedResponse<DatasetUpload>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<any>(
    `${API_ROUTES.ADMIN.DATASETS.UPLOADS.LIST(datasetId)}${query}`
  );
  
  // API returns: { success: true, data: { items, page, pageSize, total } }
  const apiData = response.data?.data || response.data;
  
  return {
    items: apiData.items || [],
    pagination: {
      page: apiData.page || 1,
      pageSize: apiData.pageSize || 50,
      total: apiData.total || 0,
      totalPages: Math.ceil((apiData.total || 0) / (apiData.pageSize || 50)),
    },
  };
}

/**
 * Start a new upload - returns presigned URL
 */
export async function startUpload(
  datasetId: string,
  data: StartUploadRequest = {}
): Promise<StartUploadResponse> {
  const response = await apiClient.post<StartUploadResponse>(
    API_ROUTES.ADMIN.DATASETS.UPLOADS.START(datasetId),
    data
  );
  return response.data;
}

/**
 * Complete an upload after file is uploaded to S3
 */
export async function completeUpload(
  datasetId: string,
  uploadId: string,
  data: CompleteUploadRequest = {}
): Promise<DatasetUpload> {
  const response = await apiClient.post<{ upload: DatasetUpload }>(
    API_ROUTES.ADMIN.DATASETS.UPLOADS.COMPLETE(datasetId, uploadId),
    data
  );
  return response.data.upload;
}

/**
 * Get download URL for a specific upload
 */
export async function getUploadDownloadUrl(
  datasetId: string,
  uploadId: string
): Promise<DownloadUrlResponse> {
  const response = await apiClient.get<{ data: DownloadUrlResponse }>(
    API_ROUTES.ADMIN.DATASETS.UPLOADS.DOWNLOAD_URL(datasetId, uploadId)
  );
  return response.data.data;
}

// ============================================
// Dataset Proposals (Stage 2)
// ============================================

/**
 * Get list of dataset proposals (supplier submissions)
 */
export async function getDatasetProposals(
  params: DatasetProposalParams = {}
): Promise<PaginatedResponse<DatasetProposalListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<any>(
    `${API_ROUTES.ADMIN.DATASET_PROPOSALS.LIST}${query}`
  );
  
  // API returns: { success: true, data: { items, page, pageSize, total } }
  const apiData = response.data?.data || response.data;
  
  return {
    items: apiData.items || [],
    pagination: {
      page: apiData.page || 1,
      pageSize: apiData.pageSize || 50,
      total: apiData.total || 0,
      totalPages: Math.ceil((apiData.total || 0) / (apiData.pageSize || 50)),
    },
  };
}

/**
 * Get complete dataset proposal details for review
 * Includes dataset, verification, assignment, metadata, features, categories, and source
 */
export async function getProposalForReview(datasetId: string): Promise<ProposalReviewResponse> {
  const response = await apiClient.get<{ data: ProposalReviewResponse }>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.REVIEW(datasetId)
  );
  return response.data.data;
}

/**
 * Pick/assign a dataset proposal to yourself for review
 */
export async function pickProposal(datasetId: string): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_PROPOSALS.PICK(datasetId));
}

/**
 * Get download URL for a proposal's current upload
 */
export async function getProposalDownloadUrl(datasetId: string): Promise<DownloadUrlResponse> {
  const response = await apiClient.get<{ data: DownloadUrlResponse }>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.DOWNLOAD_URL(datasetId)
  );
  return response.data.data;
}

/**
 * Approve a dataset proposal
 */
export async function approveProposal(
  datasetId: string,
  data?: ApproveProposalRequest
): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_PROPOSALS.APPROVE(datasetId), data || {});
}

/**
 * Reject a dataset proposal
 */
export async function rejectProposal(
  datasetId: string,
  data: RejectProposalRequest
): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_PROPOSALS.REJECT(datasetId), data);
}

/**
 * Request changes on a dataset proposal
 */
export async function requestChanges(
  datasetId: string,
  data: RequestChangesRequest
): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_PROPOSALS.REQUEST_CHANGES(datasetId), data);
}

// ============================================
// Assigned Datasets
// ============================================

/**
 * Get datasets assigned to current admin for review
 */
export async function getAssignedDatasets(
  params: AssignedDatasetParams = {}
): Promise<PaginatedResponse<AssignedDatasetListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<any>(
    `${API_ROUTES.ADMIN.ASSIGNED_DATASETS}${query}`
  );
  
  // API returns: { success: true, data: { items, page, pageSize, total } }
  const apiData = response.data?.data || response.data;
  
  return {
    items: apiData.items || [],
    pagination: {
      page: apiData.page || 1,
      pageSize: apiData.pageSize || 50,
      total: apiData.total || 0,
      totalPages: Math.ceil((apiData.total || 0) / (apiData.pageSize || 50)),
    },
  };
}

// ============================================
// Upload Helper
// ============================================

/**
 * Upload a file to a dataset using presigned URL
 * Handles the full flow: start upload → upload to S3 → complete upload
 */
export async function uploadDatasetFile(
  datasetId: string,
  file: File,
  options: {
    scope?: UploadScope;
  } = {}
): Promise<DatasetUpload> {
  // 1. Start upload to get presigned URL
  const { upload, presignedUpload } = await startUpload(datasetId, {
    scope: options.scope || 'FINAL',
    originalFileName: file.name,
    contentType: file.type,
    sizeBytes: String(file.size),
  });

  // 2. Upload file to S3 using presigned URL
  await apiClient.uploadToPresignedUrl(
    presignedUpload.url,
    file,
    file.type
  );

  // 3. Complete the upload
  const completedUpload = await completeUpload(datasetId, upload.id, {
    sizeBytes: String(file.size),
  });

  return completedUpload;
}

// ============================================
// Status Helpers
// ============================================

export function getDatasetStatusDisplay(status: DatasetStatus): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'default' | 'info';
} {
  const statusMap: Record<
    DatasetStatus,
    { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info' }
  > = {
    SUBMITTED: { label: 'Submitted', variant: 'default' },
    UNDER_REVIEW: { label: 'Under Review', variant: 'info' },
    REJECTED: { label: 'Rejected', variant: 'error' },
    VERIFIED: { label: 'Verified', variant: 'success' },
    PUBLISHED: { label: 'Published', variant: 'success' },
    ARCHIVED: { label: 'Archived', variant: 'warning' },
  };
  return statusMap[status];
}

export function getVerificationStatusDisplay(status: VerificationStatus): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'default' | 'info';
} {
  const statusMap: Record<
    VerificationStatus,
    { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info' }
  > = {
    PENDING: { label: 'Pending', variant: 'default' },
    SUBMITTED: { label: 'Submitted', variant: 'default' },
    CHANGES_REQUESTED: { label: 'Changes Requested', variant: 'warning' },
    RESUBMITTED: { label: 'Resubmitted', variant: 'info' },
    UNDER_REVIEW: { label: 'Under Review', variant: 'info' },
    VERIFIED: { label: 'Verified', variant: 'success' },
    REJECTED: { label: 'Rejected', variant: 'error' },
  };
  return statusMap[status];
}

export function canPublishDataset(dataset: Dataset): boolean {
  return (
    dataset.status === 'VERIFIED' &&
    dataset.publishedUploadId !== null
  );
}

export function canUnpublishDataset(dataset: Dataset): boolean {
  return dataset.status === 'PUBLISHED';
}
