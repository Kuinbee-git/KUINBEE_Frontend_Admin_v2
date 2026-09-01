/**
 * Supplier Invites Service
 * API calls for supplier invitation management
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  SupplierInvite,
  CreateSupplierInviteRequest,
  SupplierInviteType,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface SupplierInviteListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  supplierInviteType?: SupplierInviteType;
  sort?: 'createdAt:desc' | 'createdAt:asc';
}

// ============================================
// Supplier Invites CRUD
// ============================================

/**
 * Get paginated list of supplier invites
 */
export async function getSupplierInvites(
  params: SupplierInviteListParams = {}
): Promise<PaginatedResponse<SupplierInvite>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: SupplierInvite[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.SUPPLIER_INVITES.LIST}${query}`);

  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 10,
      total: result.total ?? 0,
    },
  };
}

/**
 * Create a new supplier invite
 */
export async function createSupplierInvite(
  data: CreateSupplierInviteRequest
): Promise<SupplierInvite> {
  const response = await apiClient.post<ApiSuccessResponse<{ invite: SupplierInvite }>>(
    API_ROUTES.ADMIN.SUPPLIER_INVITES.CREATE,
    data
  );
  return response.data.data.invite;
}

/**
 * Resend a supplier invite email
 */
export async function resendSupplierInvite(inviteId: string): Promise<SupplierInvite> {
  const response = await apiClient.post<ApiSuccessResponse<{ invite: SupplierInvite }>>(
    API_ROUTES.ADMIN.SUPPLIER_INVITES.RESEND(inviteId)
  );
  return response.data.data.invite;
}
