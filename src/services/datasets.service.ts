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
  DatasetListItem,
  DatasetDetailResponse,
  DatasetProposalListItem,
  AssignedDatasetListItem,
  DatasetUpload,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  UpdateDatasetMetadataRequest,
  DatasetMetadataUpdateResponse,
  StartUploadRequest,
  StartUploadResponse,
  CompleteUploadRequest,
  DownloadUrlResponse,
  PublishDatasetRequest,
  ApproveProposalRequest,
  RejectProposalRequest,
  RequestChangesRequest,
  ProposalReviewResponse,
  DatasetQuestionsResponse,
  DatasetQuestionDataset,
  AnswerQuestionRequest,
  DatasetPricingDto,
  VerificationStatus,
  AssignmentStatus,
  UploadScope,
  UploadStatus,
  DatasetActionReasonRequest,
  DatasetAuditEvent,
  PaginatedResponse,
  ApiSuccessResponse,
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
  ownerType?: 'PLATFORM';
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

export interface DatasetUpdateRequestParams {
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

export interface DatasetQuestionDatasetsListParams {
  page?: number;
  pageSize?: number;
  q?: string;
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
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.DATASETS.LIST}${query}`);

  const apiData = response.data.data;

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
  const response = await apiClient.get<ApiSuccessResponse<DatasetDetailResponse>>(
    API_ROUTES.ADMIN.DATASETS.DETAIL(datasetId)
  );
  return response.data.data;
}

/**
 * Create a new platform dataset
 */
export async function createDataset(data: CreateDatasetRequest): Promise<Dataset> {
  const response = await apiClient.post<ApiSuccessResponse<{ dataset: Dataset }>>(
    API_ROUTES.ADMIN.DATASETS.CREATE,
    data
  );
  return response.data.data.dataset;
}

/**
 * Update dataset basic info
 */
export async function updateDataset(
  datasetId: string,
  data: UpdateDatasetRequest
): Promise<Dataset> {
  const response = await apiClient.patch<ApiSuccessResponse<{ dataset: Dataset }>>(
    API_ROUTES.ADMIN.DATASETS.UPDATE(datasetId),
    data
  );
  return response.data.data.dataset;
}

/**
 * Update dataset metadata (about, location, format, features, tags)
 */
export async function updateDatasetMetadata(
  datasetId: string,
  data: UpdateDatasetMetadataRequest
): Promise<DatasetMetadataUpdateResponse> {
  const response = await apiClient.patch<ApiSuccessResponse<DatasetMetadataUpdateResponse>>(
    API_ROUTES.ADMIN.DATASETS.METADATA(datasetId),
    data
  );
  return response.data.data;
}

/**
 * Delete a dataset
 */
export async function deleteDataset(
  datasetId: string,
  data: DatasetActionReasonRequest
): Promise<void> {
  await apiClient.request(API_ROUTES.ADMIN.DATASETS.DELETE(datasetId), {
    method: 'DELETE',
    body: data,
  });
}

/**
 * Publish a dataset with specified upload
 */
export async function publishDataset(
  datasetId: string,
  data: PublishDatasetRequest
): Promise<Dataset> {
  const response = await apiClient.post<ApiSuccessResponse<{ dataset: Dataset }>>(
    API_ROUTES.ADMIN.DATASETS.PUBLISH(datasetId),
    data
  );
  return response.data.data.dataset;
}

/**
 * Unpublish a dataset
 */
export async function unpublishDataset(
  datasetId: string,
  data: DatasetActionReasonRequest
): Promise<Dataset> {
  const response = await apiClient.post<ApiSuccessResponse<{ dataset: Dataset }>>(
    API_ROUTES.ADMIN.DATASETS.UNPUBLISH(datasetId),
    data
  );
  return response.data.data.dataset;
}

export async function getDatasetAudit(
  datasetId: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<PaginatedResponse<DatasetAuditEvent>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetAuditEvent[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.DATASETS.AUDIT(datasetId)}${query}`);
  const data = response.data.data;
  return {
    items: data.items,
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      totalPages: Math.ceil(data.total / data.pageSize),
    },
  };
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
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetUpload[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.DATASETS.UPLOADS.LIST(datasetId)}${query}`);
  const apiData = response.data.data;

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
async function startUpload(
  datasetId: string,
  data: StartUploadRequest = {}
): Promise<StartUploadResponse> {
  const response = await apiClient.post<ApiSuccessResponse<StartUploadResponse>>(
    API_ROUTES.ADMIN.DATASETS.UPLOADS.START(datasetId),
    data
  );
  return response.data.data;
}

/**
 * Complete an upload after file is uploaded to S3
 */
async function completeUpload(
  datasetId: string,
  uploadId: string,
  data: CompleteUploadRequest = {}
): Promise<DatasetUpload> {
  const response = await apiClient.post<ApiSuccessResponse<{ upload: DatasetUpload }>>(
    API_ROUTES.ADMIN.DATASETS.UPLOADS.COMPLETE(datasetId, uploadId),
    data
  );
  return response.data.data.upload;
}

/**
 * Get download URL for a specific upload
 */
export async function getUploadDownloadUrl(
  datasetId: string,
  uploadId: string
): Promise<DownloadUrlResponse> {
  const response = await apiClient.get<ApiSuccessResponse<DownloadUrlResponse>>(
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
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetProposalListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.DATASET_PROPOSALS.LIST}${query}`);
  const apiData = response.data.data;

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
  const response = await apiClient.get<ApiSuccessResponse<ProposalReviewResponse>>(
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
  const response = await apiClient.get<ApiSuccessResponse<DownloadUrlResponse>>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.DOWNLOAD_URL(datasetId)
  );
  return response.data.data;
}

/**
 * Get download URL for a proposal's sample upload
 */
export async function getProposalSampleDownloadUrl(
  datasetId: string
): Promise<DownloadUrlResponse> {
  const response = await apiClient.get<ApiSuccessResponse<DownloadUrlResponse>>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.SAMPLE_DOWNLOAD_URL(datasetId)
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
  const notes = (data.notes ?? data.changeRationale ?? '').trim();
  await apiClient.post(API_ROUTES.ADMIN.DATASET_PROPOSALS.REQUEST_CHANGES(datasetId), {
    notes,
    changeRationale: data.changeRationale?.trim() || notes,
  });
}

export async function getDatasetQuestions(
  datasetId: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<DatasetQuestionsResponse> {
  const query = buildQueryString(params);
  const response = await apiClient.get<ApiSuccessResponse<DatasetQuestionsResponse>>(
    `${API_ROUTES.MARKETPLACE.QUESTIONS(datasetId)}${query}`
  );
  return response.data.data;
}

export async function getDatasetsWithQuestions(
  params: DatasetQuestionDatasetsListParams = {}
): Promise<PaginatedResponse<DatasetQuestionDataset>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetQuestionDataset[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.MARKETPLACE.QUESTION_DATASETS}${query}`);

  const apiData = response.data.data;

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

export async function answerDatasetQuestion(
  questionId: string,
  data: AnswerQuestionRequest
): Promise<void> {
  await apiClient.post(API_ROUTES.MARKETPLACE.ANSWER_QUESTION(questionId), data);
}

export async function deleteDatasetQuestion(
  questionId: string,
  data: DatasetActionReasonRequest
): Promise<void> {
  await apiClient.request(API_ROUTES.MARKETPLACE.DELETE_QUESTION(questionId), {
    method: 'DELETE',
    body: data,
  });
}

// ============================================
// Dataset Update Requests
// ============================================

/**
 * Get list of dataset update requests (separate admin queue)
 */
export async function getDatasetUpdateRequests(
  params: DatasetUpdateRequestParams = {}
): Promise<PaginatedResponse<DatasetProposalListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: DatasetProposalListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.LIST}${query}`);
  const apiData = response.data.data;

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

export async function pickUpdateRequest(datasetId: string): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.PICK(datasetId));
}

export async function approveUpdateRequest(
  datasetId: string,
  data?: ApproveProposalRequest
): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.APPROVE(datasetId), data || {});
}

export async function rejectUpdateRequest(
  datasetId: string,
  data: RejectProposalRequest
): Promise<void> {
  await apiClient.post(API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.REJECT(datasetId), data);
}

export async function requestUpdateRequestChanges(
  datasetId: string,
  data: RequestChangesRequest
): Promise<void> {
  const notes = (data.notes ?? data.changeRationale ?? '').trim();
  await apiClient.post(API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.REQUEST_CHANGES(datasetId), {
    notes,
    changeRationale: data.changeRationale?.trim() || notes,
  });
}

// ============================================
// Proposal Pricing
// ============================================

/**
 * Approve proposal pricing
 */
export async function approvePricing(
  datasetId: string,
  data?: { notes?: string }
): Promise<{ pricing: DatasetPricingDto }> {
  const response = await apiClient.post<ApiSuccessResponse<{ pricing: DatasetPricingDto }>>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.PRICING.APPROVE(datasetId),
    data || {}
  );
  return response.data.data;
}

/**
 * Reject proposal pricing
 */
export async function rejectPricing(
  datasetId: string,
  data: { rejectionReason: string; notes?: string }
): Promise<{ pricing: DatasetPricingDto }> {
  const response = await apiClient.post<ApiSuccessResponse<{ pricing: DatasetPricingDto }>>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.PRICING.REJECT(datasetId),
    data
  );
  return response.data.data;
}

/**
 * Request changes on proposal pricing
 */
export async function requestPricingChanges(
  datasetId: string,
  data: { notes: string; datasetNeedsChanges: boolean; pricingNeedsChanges: boolean }
): Promise<{ pricing: DatasetPricingDto }> {
  const response = await apiClient.post<ApiSuccessResponse<{ pricing: DatasetPricingDto }>>(
    API_ROUTES.ADMIN.DATASET_PROPOSALS.PRICING.REQUEST_CHANGES(datasetId),
    {
      notes: data.notes || '',
      changeRationale: data.notes,
    }
  );
  return response.data.data;
}

export async function approveUpdateRequestPricing(
  datasetId: string,
  data?: { notes?: string }
): Promise<{ pricing: DatasetPricingDto }> {
  const response = await apiClient.post<ApiSuccessResponse<{ pricing: DatasetPricingDto }>>(
    API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.PRICING.APPROVE(datasetId),
    data || {}
  );
  return response.data.data;
}

export async function rejectUpdateRequestPricing(
  datasetId: string,
  data: { rejectionReason: string; notes?: string }
): Promise<{ pricing: DatasetPricingDto }> {
  const response = await apiClient.post<ApiSuccessResponse<{ pricing: DatasetPricingDto }>>(
    API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.PRICING.REJECT(datasetId),
    data
  );
  return response.data.data;
}

export async function requestUpdateRequestPricingChanges(
  datasetId: string,
  data: { notes: string; datasetNeedsChanges: boolean; pricingNeedsChanges: boolean }
): Promise<{ pricing: DatasetPricingDto }> {
  const response = await apiClient.post<ApiSuccessResponse<{ pricing: DatasetPricingDto }>>(
    API_ROUTES.ADMIN.DATASET_UPDATE_REQUESTS.PRICING.REQUEST_CHANGES(datasetId),
    {
      notes: data.notes || '',
      changeRationale: data.notes,
    }
  );
  return response.data.data;
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
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: AssignedDatasetListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.ASSIGNED_DATASETS}${query}`);
  const apiData = response.data.data;

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
  await apiClient.uploadToPresignedUrl(presignedUpload.url, file, presignedUpload.headers);

  // 3. Complete the upload
  const completedUpload = await completeUpload(datasetId, upload.id, {
    sizeBytes: String(file.size),
  });

  return completedUpload;
}
