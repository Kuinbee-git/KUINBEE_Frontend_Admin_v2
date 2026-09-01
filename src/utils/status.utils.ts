/**
 * Status utilities for user management
 * All status values are UPPERCASE to match backend
 */

import type { UserStatus } from '@/types/user.types';

export type SemanticStatus = 'success' | 'error' | 'warning' | 'neutral';

/**
 * Get status badge information for user status
 */
function getUserStatusInfo(status: UserStatus): {
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
        description:
          'User cannot log in or access datasets. All access is revoked until suspension is lifted.',
      };
    case 'PENDING_VERIFICATION':
      return {
        label: 'Pending Verification',
        semanticType: 'warning',
        description:
          'User account is awaiting email verification. Limited functionality available.',
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
