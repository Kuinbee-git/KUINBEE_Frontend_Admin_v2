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
  const response = await apiClient.get<ApiSuccessResponse<{ items: Invite[]; page: number; pageSize: number; total: number }>>(
    `${API_ROUTES.ADMIN.ADMIN_INVITES.LIST}${query}`
  );
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
 * Get invite detail by ID
 */
export async function getInviteById(inviteId: string): Promise<Invite> {
  const response = await apiClient.get<InviteResponse>(
    API_ROUTES.ADMIN.ADMIN_INVITES.DETAIL(inviteId)
  );
  return response.data.invite;
}

/**
 * Create a new admin invite
 */
export async function createInvite(data: CreateInviteRequest): Promise<Invite> {
  const response = await apiClient.post<InviteResponse>(
    API_ROUTES.ADMIN.ADMIN_INVITES.CREATE,
    data
  );
  return response.data.invite;
}

/**
 * Resend an invite email
 */
export async function resendInvite(inviteId: string): Promise<ResendInviteResponse['invite']> {
  const response = await apiClient.post<ResendInviteResponse>(
    API_ROUTES.ADMIN.ADMIN_INVITES.RESEND(inviteId)
  );
  return response.data.invite;
}

/**
 * Cancel an active invite
 */
export async function cancelInvite(inviteId: string): Promise<CancelInviteResponse['invite']> {
  const response = await apiClient.post<CancelInviteResponse>(
    API_ROUTES.ADMIN.ADMIN_INVITES.CANCEL(inviteId)
  );
  return response.data.invite;
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
  const response = await apiClient.get<ApiSuccessResponse<{
    items: InviteAuditEntry[];
    page: number;
    pageSize: number;
    total: number;
  }>>(
    `${API_ROUTES.SUPERADMIN.AUDIT.INVITES}${query}`
  );
  
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

// ============================================
// Helpers
// ============================================

export function getInviteStatusDisplay(status: InviteStatus): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'default';
} {
  const statusMap: Record<
    InviteStatus,
    { label: string; variant: 'success' | 'warning' | 'error' | 'default' }
  > = {
    ACTIVE: { label: 'Active', variant: 'success' },
    USED: { label: 'Used', variant: 'default' },
    CANCELLED: { label: 'Cancelled', variant: 'warning' },
    EXPIRED: { label: 'Expired', variant: 'error' },
  };
  return statusMap[status];
}

export function canResendInvite(invite: Invite): boolean {
  return invite.usedAt === null && invite.cancelledAt === null;
}

export function canCancelInvite(invite: Invite): boolean {
  return invite.usedAt === null && invite.cancelledAt === null;
}
