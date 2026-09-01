/**
 * Suppliers Service
 * API calls for supplier management
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  SupplierListItem,
  SupplierDetail,
  SupplierAnalytics,
  SupplierKyc,
  SupplierManualKycQueueResponse,
  SupplierManualKycPickResponse,
  SupplierManualKycVerifyResponse,
  SupplierManualKycRejectResponse,
  ManualKycStatus,
  RejectSupplierKycRequest,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';
import type { BusinessDomain } from '@/types/supplier.types';

// ============================================
// Types
// ============================================

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  supplierType?: 'INDIVIDUAL' | 'COMPANY' | 'ALL';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED' | 'ALL';
  contactEmailVerified?: boolean;
  businessDomains?: BusinessDomain[];
  sort?: 'createdAt:desc' | 'createdAt:asc';
}

export interface SupplierAnalyticsParams {
  windowDays?: number;
}

export interface SupplierManualKycQueueParams {
  page?: number;
  pageSize?: number;
  status?: ManualKycStatus;
}

/**
 * Accept the standard `{ success, data }` envelope and the previous flat
 * response during rolling deployments, so the queue stays available while
 * frontend and backend instances are replaced.
 */
type SupplierKycApiResponse<T extends object> = ApiSuccessResponse<T> | (T & { success: true });

function unwrapSupplierKycResponse<T extends object>(response: SupplierKycApiResponse<T>): T {
  if ('data' in response && response.data && typeof response.data === 'object') {
    return response.data as T;
  }
  return response as T;
}

// ============================================
// Suppliers CRUD
// ============================================

/**
 * Get paginated list of suppliers with filtering
 */
export async function getSuppliers(
  params: SupplierListParams = {}
): Promise<PaginatedResponse<SupplierListItem>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: SupplierListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.SUPPLIERS.LIST}${query}`);

  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 20,
      total: result.total ?? 0,
    },
  };
}

/**
 * Get supplier detail by ID
 */
export async function getSupplierById(supplierId: string): Promise<SupplierDetail> {
  const response = await apiClient.get<ApiSuccessResponse<SupplierDetail>>(
    API_ROUTES.ADMIN.SUPPLIERS.DETAIL(supplierId)
  );
  return response.data.data;
}

/**
 * Get supplier analytics
 */
export async function getSupplierAnalytics(
  supplierId: string,
  params: SupplierAnalyticsParams = {}
): Promise<SupplierAnalytics> {
  const query = buildQueryString(params);
  const response = await apiClient.get<ApiSuccessResponse<SupplierAnalytics>>(
    `${API_ROUTES.ADMIN.SUPPLIERS.ANALYTICS(supplierId)}${query}`
  );
  return response.data.data;
}

/**
 * Get supplier KYC details
 */
export async function getSupplierKyc(supplierId: string): Promise<SupplierKyc> {
  const response = await apiClient.get<ApiSuccessResponse<SupplierKyc>>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC(supplierId)
  );
  return response.data.data;
}

/**
 * Get manual KYC queue
 */
export async function getSupplierManualKycQueue(
  params: SupplierManualKycQueueParams = {}
): Promise<PaginatedResponse<NonNullable<SupplierManualKycQueueResponse['items']>[number]>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<SupplierKycApiResponse<SupplierManualKycQueueResponse>>(
    `${API_ROUTES.ADMIN.SUPPLIERS.KYC_QUEUE}${query}`
  );
  const result = unwrapSupplierKycResponse(response.data);

  if (
    !Array.isArray(result.items) ||
    !Number.isInteger(result.page) ||
    result.page < 1 ||
    !Number.isInteger(result.pageSize) ||
    result.pageSize < 1 ||
    !Number.isInteger(result.total) ||
    result.total < 0
  ) {
    throw new Error('Supplier KYC queue returned an invalid response');
  }

  return {
    items: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    },
  };
}

/**
 * Pick supplier KYC for review
 */
export async function pickSupplierManualKyc(
  supplierId: string
): Promise<SupplierManualKycPickResponse> {
  const response = await apiClient.post<SupplierKycApiResponse<SupplierManualKycPickResponse>>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC_PICK(supplierId)
  );
  return unwrapSupplierKycResponse(response.data);
}

/**
 * Verify supplier manual KYC
 */
export async function verifySupplierManualKyc(
  supplierId: string
): Promise<SupplierManualKycVerifyResponse> {
  const response = await apiClient.post<SupplierKycApiResponse<SupplierManualKycVerifyResponse>>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC_VERIFY(supplierId)
  );
  return unwrapSupplierKycResponse(response.data);
}

/**
 * Reject supplier manual KYC
 */
export async function rejectSupplierManualKyc(
  supplierId: string,
  data: RejectSupplierKycRequest
): Promise<SupplierManualKycRejectResponse> {
  const response = await apiClient.post<SupplierKycApiResponse<SupplierManualKycRejectResponse>>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC_REJECT(supplierId),
    data
  );
  return unwrapSupplierKycResponse(response.data);
}

// ============================================
// Offline Contract Management
// ============================================

export interface OfflineContractResponse {
  supplierId: string;
  isOfflineContractDone: boolean;
  offlineContractDoneAt: string; // ISO timestamp
  offlineContractDoneBy: string; // Admin userId
}

/**
 * Mark a supplier's offline contract as completed
 * Unblocks publishing for the supplier
 */
export async function markOfflineContractDone(
  supplierId: string
): Promise<OfflineContractResponse> {
  const response = await apiClient.post<ApiSuccessResponse<OfflineContractResponse>>(
    API_ROUTES.ADMIN.SUPPLIERS.MARK_OFFLINE_CONTRACT_DONE(supplierId)
  );
  return response.data.data;
}
