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
  SupplierManualKycActionResponse,
  ManualKycStatus,
  RejectSupplierKycRequest,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  supplierType?: "INDIVIDUAL" | "COMPANY" | "ALL";
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED" | "ALL";
  sort?: "createdAt:desc" | "createdAt:asc";
}

export interface SupplierAnalyticsParams {
  windowDays?: number;
}

export interface SupplierManualKycQueueParams {
  page?: number;
  pageSize?: number;
  status?: ManualKycStatus;
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
  const response = await apiClient.get<ApiSuccessResponse<{
    items: SupplierListItem[];
    page: number;
    pageSize: number;
    total: number;
  }>>(
    `${API_ROUTES.ADMIN.SUPPLIERS.LIST}${query}`
  );
  
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
  const response = await apiClient.get<ApiSuccessResponse<SupplierManualKycQueueResponse> | SupplierManualKycQueueResponse>(
    `${API_ROUTES.ADMIN.SUPPLIERS.KYC_QUEUE}${query}`
  );
  const payload = response.data as ApiSuccessResponse<SupplierManualKycQueueResponse> | SupplierManualKycQueueResponse;
  const result = "data" in payload ? payload.data : payload;

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
 * Pick supplier KYC for review
 */
export async function pickSupplierManualKyc(supplierId: string): Promise<SupplierManualKycActionResponse> {
  const response = await apiClient.post<ApiSuccessResponse<SupplierManualKycActionResponse> | SupplierManualKycActionResponse>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC_PICK(supplierId)
  );
  const payload = response.data as ApiSuccessResponse<SupplierManualKycActionResponse> | SupplierManualKycActionResponse;
  return "data" in payload ? payload.data : payload;
}

/**
 * Verify supplier manual KYC
 */
export async function verifySupplierManualKyc(supplierId: string): Promise<SupplierManualKycActionResponse> {
  const response = await apiClient.post<ApiSuccessResponse<SupplierManualKycActionResponse> | SupplierManualKycActionResponse>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC_VERIFY(supplierId)
  );
  const payload = response.data as ApiSuccessResponse<SupplierManualKycActionResponse> | SupplierManualKycActionResponse;
  return "data" in payload ? payload.data : payload;
}

/**
 * Reject supplier manual KYC
 */
export async function rejectSupplierManualKyc(
  supplierId: string,
  data: RejectSupplierKycRequest
): Promise<SupplierManualKycActionResponse> {
  const response = await apiClient.post<ApiSuccessResponse<SupplierManualKycActionResponse> | SupplierManualKycActionResponse>(
    API_ROUTES.ADMIN.SUPPLIERS.KYC_REJECT(supplierId),
    data
  );
  const payload = response.data as ApiSuccessResponse<SupplierManualKycActionResponse> | SupplierManualKycActionResponse;
  return "data" in payload ? payload.data : payload;
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
    `/v1/admin/suppliers/${supplierId}/offline-contract/mark-done`
  );
  return response.data.data;
}