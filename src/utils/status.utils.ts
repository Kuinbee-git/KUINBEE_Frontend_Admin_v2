/**
 * Status utilities for user management
 * All status values are UPPERCASE to match backend
 */

import { UserStatus, AccessType } from '@/types/user.types';

export type SemanticStatus = 'success' | 'error' | 'warning' | 'neutral';

/**
 * Get status badge information for user status
 */
export function getUserStatusInfo(status: UserStatus): {
  label: string;
  semanticType: SemanticStatus;
  description: string;
} {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active',
        semanticType: 'success',
        description: 'User can log in and access all granted datasets.',
      };
    case 'SUSPENDED':
      return {
        label: 'Suspended',
        semanticType: 'error',
        description: 'User cannot log in or access datasets. All access is revoked until suspension is lifted.',
      };
    case 'PENDING_VERIFICATION':
      return {
        label: 'Pending Verification',
        semanticType: 'warning',
        description: 'User account is awaiting email verification. Limited functionality available.',
      };
    case 'DELETED':
      return {
        label: 'Deleted',
        semanticType: 'neutral',
        description: 'User account has been soft-deleted. No login or data access possible.',
      };
    case 'INACTIVE':
      return {
        label: 'Inactive',
        semanticType: 'neutral',
        description: 'User account is inactive.',
      };
    default:
      return {
        label: status,
        semanticType: 'neutral',
        description: 'Unknown status.',
      };
  }
}

/**
 * Get semantic type for user status (for StatusBadge)
 */
export function getUserStatusSemantic(status: UserStatus): SemanticStatus {
  return getUserStatusInfo(status).semanticType;
}

/**
 * Get color and styling info for access type badges
 */
export function getAccessTypeInfo(type: AccessType): {
  color: string;
  bg: string;
  border: string;
} {
  switch (type) {
    case 'PURCHASED':
      return {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.3)',
      };
    case 'FREE':
      return {
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.1)',
        border: 'rgba(56, 189, 248, 0.3)',
      };
    case 'TRIAL':
      return {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
      };
    case 'GIFTED':
      return {
        color: '#a78bfa',
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.3)',
      };
    default:
      return {
        color: 'var(--text-muted)',
        bg: 'var(--bg-surface)',
        border: 'var(--border-default)',
      };
  }
}

/**
 * Get display label for access type
 */
export function getAccessTypeLabel(type: AccessType): string {
  const labels: Record<AccessType, string> = {
    PURCHASED: 'Purchased',
    FREE: 'Free',
    TRIAL: 'Trial',
    GIFTED: 'Gifted',
  };
  return labels[type] || type;
}

/**
 * Get display label for user status
 */
export function getUserStatusLabel(status: UserStatus): string {
  return getUserStatusInfo(status).label;
}
