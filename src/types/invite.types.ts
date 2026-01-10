/**
 * Invite Types
 * Matches backend /api/v1/superadmin/invites/* responses
 */

// ============================================
// Enums
// ============================================

export type InviteStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';

export type InviteAuditEventType = 'CREATED' | 'RESENT' | 'CANCELLED' | 'USED';

// ============================================
// Invite Entity
// ============================================

export interface InviteRole {
  roleId: string;
  name: string;
  displayName: string;
}

export interface Invite {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  cancelledAt: string | null;
  resendCount: number;
  lastSentAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  roles: InviteRole[];
}

// ============================================
// Request Types
// ============================================

export interface CreateInviteRequest {
  email: string;
  roleIds: string[];
  expiresInHours?: number;
  sendEmail?: boolean;
}

// ============================================
// Response Types
// ============================================

export interface InviteResponse {
  invite: Invite;
}

export interface ResendInviteResponse {
  invite: {
    id: string;
    email: string;
    expiresAt: string;
    usedAt: string | null;
    cancelledAt: string | null;
    resendCount: number;
    lastSentAt: string | null;
    updatedAt: string;
  };
}

export interface CancelInviteResponse {
  invite: {
    id: string;
    cancelledAt: string;
    updatedAt: string;
  };
}

// ============================================
// Audit Types
// ============================================

export interface InviteAuditEntry {
  id: string;
  inviteId: string;
  inviteEmail: string;
  eventType: InviteAuditEventType;
  actor: {
    id: string;
    email: string;
  };
  createdAt: string;
  metadata: Record<string, unknown> | null;
}
