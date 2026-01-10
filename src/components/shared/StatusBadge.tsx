/**
 * StatusBadge - Canonical badge component for all list pages
 *
 * Design Philosophy:
 * - Single component across all list pages
 * - Consistent height, padding, radius, and font
 * - Color reflects semantic meaning only
 * - No visual variance between different entity types
 */

import React from 'react';
import { Badge } from '../ui/badge';

type SemanticStatus =
  | 'success' // Published, Verified, Approved
  | 'in_progress' // Under Review, In Progress
  | 'pending' // Pending Verification, Pending
  | 'neutral' // Draft, Unassigned
  | 'warning' // Changes Requested
  | 'error'; // Rejected, Failed

interface StatusBadgeProps {
  status: string;
  semanticType: SemanticStatus;
}

const semanticStyles: Record<SemanticStatus, { bg: string; color: string; border: string }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--state-success)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  in_progress: {
    bg: 'rgba(56, 189, 248, 0.1)',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  pending: {
    bg: 'rgba(245, 158, 11, 0.1)',
    color: 'var(--state-warning)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  neutral: {
    bg: 'rgba(107, 114, 128, 0.1)',
    color: 'var(--text-muted)',
    border: 'rgba(107, 114, 128, 0.3)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    color: 'var(--state-warning)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--state-error)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
};

export function StatusBadge({ status, semanticType }: StatusBadgeProps) {
  const style = semanticStyles[semanticType];

  return (
    <Badge
      variant="outline"
      className="text-xs"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        borderColor: style.border,
      }}
    >
      {status}
    </Badge>
  );
}

// Helper function to map dataset status to semantic type
export function getDatasetStatusSemantic(status: string): SemanticStatus {
  const normalizedStatus = status.toUpperCase();
  switch (normalizedStatus) {
    case 'PUBLISHED':
    case 'VERIFIED':
    case 'APPROVED':
      return 'success';
    case 'UNDER_REVIEW':
      return 'in_progress';
    case 'SUBMITTED':
    case 'PENDING_VERIFICATION':
    case 'PENDING_REVIEW':
    case 'PENDING':
      return 'pending';
    case 'CHANGES_REQUESTED':
      return 'warning';
    case 'REJECTED':
      return 'error';
    case 'DRAFT':
    case 'UNPUBLISHED':
    case 'ARCHIVED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

// Helper function to map verification status to semantic type
export function getVerificationStatusSemantic(status: string): SemanticStatus {
  const normalizedStatus = status.toUpperCase();
  switch (normalizedStatus) {
    case 'VERIFIED':
      return 'success';
    case 'UNDER_REVIEW':
      return 'in_progress';
    case 'PENDING':
    case 'SUBMITTED':
    case 'RESUBMITTED':
      return 'pending';
    case 'CHANGES_REQUESTED':
      return 'warning';
    case 'REJECTED':
      return 'error';
    default:
      return 'neutral';
  }
}

// Helper function to map KYC status to semantic type
export function getKYCStatusSemantic(status: string): SemanticStatus {
  switch (status) {
    case 'verified':
      return 'success';
    case 'in_progress':
      return 'in_progress';
    case 'pending':
      return 'pending';
    case 'rejected':
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

// Format status labels consistently
export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
