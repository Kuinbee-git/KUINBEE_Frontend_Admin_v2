/**
 * StatusBadge - Canonical badge component for all list pages
 *
 * Design Philosophy:
 * - Single component across all list pages
 * - Consistent height, padding, radius, and font
 * - Color reflects semantic meaning only
 * - No visual variance between different entity types
 */

import { type CSSProperties } from 'react';
import { Badge } from '../ui/badge';

export type SemanticStatus =
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
    bg: 'var(--status-success-bg)',
    color: 'var(--status-success)',
    border: 'var(--status-success-border)',
  },
  in_progress: {
    bg: 'var(--status-info-bg)',
    color: 'var(--status-info)',
    border: 'var(--status-info-border)',
  },
  pending: {
    bg: 'var(--status-warning-bg)',
    color: 'var(--status-warning)',
    border: 'var(--status-warning-border)',
  },
  neutral: {
    bg: 'var(--status-neutral-bg)',
    color: 'var(--status-neutral)',
    border: 'var(--status-neutral-border)',
  },
  warning: {
    bg: 'var(--status-warning-bg)',
    color: 'var(--status-warning)',
    border: 'var(--status-warning-border)',
  },
  error: {
    bg: 'var(--status-error-bg)',
    color: 'var(--status-error)',
    border: 'var(--status-error-border)',
  },
};

export function getSemanticStatusStyle(semanticType: SemanticStatus): CSSProperties {
  const style = semanticStyles[semanticType];
  return {
    backgroundColor: style.bg,
    color: style.color,
    borderColor: style.border,
  };
}

export function StatusBadge({ status, semanticType }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs" style={getSemanticStatusStyle(semanticType)}>
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
    case 'RESUBMITTED':
    case 'PENDING_VERIFICATION':
    case 'PENDING_REVIEW':
    case 'PENDING':
      return 'pending';
    case 'CHANGES_REQUESTED':
    case 'DELISTED':
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
  switch (status.toUpperCase()) {
    case 'VERIFIED':
      return 'success';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
    case 'FAILED':
      return 'error';
    default:
      return 'neutral';
  }
}

const DISPLAY_ACRONYMS = new Set([
  'API',
  'CSV',
  'GST',
  'GSTIN',
  'ID',
  'JSON',
  'KYC',
  'PAN',
  'PDF',
  'URL',
  'XML',
  'ZIP',
]);

export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => {
      const upper = word.toUpperCase();
      if (DISPLAY_ACRONYMS.has(upper)) return upper;
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

// Format status labels consistently.
export function formatStatusLabel(status: string): string {
  return formatEnumLabel(status);
}
