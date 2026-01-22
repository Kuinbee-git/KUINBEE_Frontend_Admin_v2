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
    `/api/v1/admin/suppliers/${supplierId}/offline-contract/mark-done`
  );
  return response.data.data;
}