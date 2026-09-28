import type { SemanticStatus } from '@/components/shared/StatusBadge';
import type { ClaruFileType, ClaruSubmissionState } from '@/types';

export function claruStateLabel(state: ClaruSubmissionState): string {
  switch (state) {
    case 'in_review':
      return 'In review';
    default:
      return state.charAt(0).toUpperCase() + state.slice(1);
  }
}

export function claruStateSemantic(state: ClaruSubmissionState): SemanticStatus {
  switch (state) {
    case 'approved':
      return 'success';
    case 'processing':
    case 'in_review':
      return 'in_progress';
    case 'refused':
    case 'expired':
      return 'warning';
    case 'rejected':
      return 'error';
    case 'draft':
      return 'neutral';
  }
}

export function claruFileTypeLabel(fileType: ClaruFileType): string {
  const labels: Record<ClaruFileType, string> = {
    video: 'Primary video',
    inputs: 'IMU inputs',
    frames: 'Frame timestamps',
    video_right: 'Right-eye video',
    calibration: 'Calibration',
    other: 'Other sidecar',
  };
  return labels[fileType];
}

export function formatClaruDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes} min` : `${minutes.toFixed(1)} min`;
}

export function formatBytes(bytes: string | number): string {
  const value = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 1024) return `${value} B`;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let size = value / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && size >= 1024; index += 1) {
    size /= 1024;
    unit = units[index];
  }
  return `${size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${unit}`;
}
