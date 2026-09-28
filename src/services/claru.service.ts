import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  ApiSuccessResponse,
  ClaruBatch,
  ClaruBatchCreateInput,
  ClaruBatchListParams,
  ClaruDiscovery,
  ClaruPage,
  ClaruStoredPart,
  ClaruSubmission,
  ClaruSubmissionCreateInput,
  ClaruSubmissionCreateResult,
  ClaruSubmissionListParams,
} from '@/types';

interface BackendPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

function toPage<T>(page: BackendPage<T>): ClaruPage<T> {
  return {
    items: page.items,
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: Math.max(1, Math.ceil(page.total / page.pageSize)),
    },
  };
}

export async function getClaruProjects(): Promise<ClaruDiscovery> {
  const response = await apiClient.get<ApiSuccessResponse<ClaruDiscovery>>(
    API_ROUTES.ADMIN.CLARU.PROJECTS
  );
  return response.data.data;
}

export async function listClaruBatches(
  params: ClaruBatchListParams
): Promise<ClaruPage<ClaruBatch>> {
  const response = await apiClient.get<ApiSuccessResponse<BackendPage<ClaruBatch>>>(
    `${API_ROUTES.ADMIN.CLARU.BATCHES}${buildQueryString(params)}`
  );
  return toPage(response.data.data);
}

export async function createClaruBatch(input: ClaruBatchCreateInput): Promise<ClaruBatch> {
  const response = await apiClient.post<ApiSuccessResponse<ClaruBatch>>(
    API_ROUTES.ADMIN.CLARU.BATCHES,
    input
  );
  return response.data.data;
}

export async function getClaruBatch(batchId: string): Promise<ClaruBatch> {
  const response = await apiClient.get<ApiSuccessResponse<ClaruBatch>>(
    API_ROUTES.ADMIN.CLARU.BATCH(batchId)
  );
  return response.data.data;
}

export async function createClaruSubmission(
  { batchId, ...input }: ClaruSubmissionCreateInput,
  options: { signal?: AbortSignal } = {}
): Promise<ClaruSubmissionCreateResult> {
  const response = await apiClient.request<ApiSuccessResponse<ClaruSubmissionCreateResult>>(
    API_ROUTES.ADMIN.CLARU.CREATE_SUBMISSION(batchId),
    { method: 'POST', body: input, timeoutMs: 120_000, signal: options.signal }
  );
  return response.data.data;
}

export async function listClaruSubmissions(
  params: ClaruSubmissionListParams
): Promise<ClaruPage<ClaruSubmission>> {
  const response = await apiClient.get<ApiSuccessResponse<BackendPage<ClaruSubmission>>>(
    `${API_ROUTES.ADMIN.CLARU.SUBMISSIONS}${buildQueryString(params)}`
  );
  return toPage(response.data.data);
}

export async function getClaruSubmission(submissionId: string): Promise<ClaruSubmission> {
  const response = await apiClient.get<ApiSuccessResponse<ClaruSubmission>>(
    API_ROUTES.ADMIN.CLARU.SUBMISSION(submissionId)
  );
  return response.data.data;
}

export async function checkpointClaruPart(input: {
  submissionId: string;
  partId: string;
  uploadId: string;
  partNumber: number;
  etag: string;
}): Promise<ClaruStoredPart> {
  const response = await apiClient.post<ApiSuccessResponse<ClaruStoredPart>>(
    API_ROUTES.ADMIN.CLARU.CHECKPOINT_PART(input.submissionId, input.partId),
    { uploadId: input.uploadId, partNumber: input.partNumber, etag: input.etag }
  );
  return response.data.data;
}

export async function completeClaruPart(input: {
  submissionId: string;
  partId: string;
}): Promise<ClaruSubmission> {
  const response = await apiClient.request<ApiSuccessResponse<ClaruSubmission>>(
    API_ROUTES.ADMIN.CLARU.COMPLETE_PART(input.submissionId, input.partId),
    { method: 'POST', body: {}, timeoutMs: 120_000 }
  );
  return response.data.data;
}

export async function sealClaruSubmission(submissionId: string): Promise<ClaruSubmission> {
  const response = await apiClient.request<ApiSuccessResponse<ClaruSubmission>>(
    API_ROUTES.ADMIN.CLARU.SEAL(submissionId),
    { method: 'POST', body: {}, timeoutMs: 120_000 }
  );
  return response.data.data;
}

export async function syncClaruSubmission(submissionId: string): Promise<ClaruSubmission> {
  const response = await apiClient.post<ApiSuccessResponse<ClaruSubmission>>(
    API_ROUTES.ADMIN.CLARU.SYNC(submissionId),
    {}
  );
  return response.data.data;
}
