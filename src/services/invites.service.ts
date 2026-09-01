/**
 * Invites Service
 * API calls for admin invitation management
 * Uses /admin/admin-invites (permission-based, works for superadmin + CREATE_ADMIN)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  Invite,
  InviteStatus,
  CreateInviteRequest,
  InviteResponse,
  ResendInviteResponse,
  CancelInviteResponse,
  InviteAuditEntry,
  InviteAuditEventType,
  PaginatedResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface InviteListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: InviteStatus | 'ALL';
  sort?: string;
}

export interface InviteAuditParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  inviteId?: string;
  eventType?: InviteAuditEventType;
  actorId?: string;
  q?: string;
  sort?: string;
}

// ============================================
// Invites CRUD
// ============================================

/**
 * Get paginated list of invites
 */
export async function getInvites(
  params: InviteListParams = {}
): Promise<PaginatedResponse<Invite>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{ items: Invite[]; page: number; pageSize: number; total: number }>
  >(`${API_ROUTES.ADMIN.ADMIN_INVITES.LIST}${query}`);
  // Backend wraps paginated data in { success, data } structure
  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 10,
      total: result.total ?? 0,
      // totalPages intentionally omitted for type safety
    },
  };
}

/**
 * Create a new admin invite
 */
export async function createInvite(data: CreateInviteRequest): Promise<Invite> {
  const response = await apiClient.post<ApiSuccessResponse<InviteResponse>>(
    API_ROUTES.ADMIN.ADMIN_INVITES.CREATE,
    data
  );
  return response.data.data.invite;
}

/**
 * Resend an invite email
 */
export async function resendInvite(inviteId: string): Promise<ResendInviteResponse['invite']> {
  const response = await apiClient.post<ApiSuccessResponse<ResendInviteResponse>>(
    API_ROUTES.ADMIN.ADMIN_INVITES.RESEND(inviteId)
  );
  return response.data.data.invite;
}

/**
 * Cancel an active invite
 */
export async function cancelInvite(inviteId: string): Promise<CancelInviteResponse['invite']> {
  const response = await apiClient.post<ApiSuccessResponse<CancelInviteResponse>>(
    API_ROUTES.ADMIN.ADMIN_INVITES.CANCEL(inviteId)
  );
  return response.data.data.invite;
}

// ============================================
// Audit
// ============================================

/**
 * Get invite audit log
 */
export async function getInviteAudit(
  params: InviteAuditParams = {}
): Promise<PaginatedResponse<InviteAuditEntry>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: InviteAuditEntry[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.SUPERADMIN.AUDIT.INVITES}${query}`);

  const result = response.data.data;
  return {
    items: Array.isArray(result.items) ? result.items : [],
    pagination: {
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 50,
      total: result.total ?? 0,
    },
  };
}
