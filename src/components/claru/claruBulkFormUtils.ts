import type {
  ClaruBatch,
  ClaruBatchDefaults,
  ClaruFileType,
  ClaruProject,
  ClaruSubmissionCreateInput,
} from '@/types';
import { claruFileError, validClaruAxis } from './claruFormUtils';
import { claruFileTypeLabel } from './claruAdminUtils';

export type ClaruBulkCapture = Required<ClaruBatchDefaults>;

export interface ClaruBulkRow extends ClaruBulkCapture {
  id: string;
  video: File;
  externalRef: string;
  categoryCode: string;
  recordedAt: string;
  durationMinutes: string;
  durationSource: 'reading' | 'video' | 'manual';
  relatedFiles: Partial<Record<ClaruFileType, File[]>>;
  axisConvention: string;
  videoStartUs: string;
  matchingFileConfirmed: boolean;
}

export interface ClaruBulkDuplicateCounts {
  references: Map<string, number>;
  files: Map<string, number>;
}

export function countClaruBulkDuplicates(rows: ClaruBulkRow[]): ClaruBulkDuplicateCounts {
  const references = new Map<string, number>();
  const files = new Map<string, number>();
  for (const row of rows) {
    const reference = row.externalRef.trim();
    const fingerprint = claruBulkFileFingerprint(row.video);
    references.set(reference, (references.get(reference) ?? 0) + 1);
    files.set(fingerprint, (files.get(fingerprint) ?? 0) + 1);
  }
  return { references, files };
}

export const claruBulkCaptureFields: Array<{
  key: keyof ClaruBulkCapture;
  label: string;
  maxLength: number;
}> = [
  { key: 'country', label: 'Country', maxLength: 2 },
  { key: 'collectorId', label: 'Collector ID', maxLength: 200 },
  { key: 'siteId', label: 'Site ID', maxLength: 200 },
  { key: 'device', label: 'Device', maxLength: 300 },
  { key: 'mount', label: 'Mount', maxLength: 200 },
];

export function claruBulkCaptureDefaults(batch: ClaruBatch): ClaruBulkCapture {
  return {
    country: batch.defaults?.country ?? 'IN',
    collectorId: batch.defaults?.collectorId ?? '',
    siteId: batch.defaults?.siteId ?? '',
    device: batch.defaults?.device ?? '',
    mount: batch.defaults?.mount ?? '',
  };
}

export function claruBulkReference(prefix: string, fileName: string, clipNumber?: number): string {
  const base = fileName
    .replace(/\.mp4$/i, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  const suffix = clipNumber === undefined ? '' : `-${String(clipNumber).padStart(4, '0')}`;
  return (
    [prefix.trim(), base]
      .filter(Boolean)
      .join('-')
      .slice(0, 200 - suffix.length) + suffix
  );
}

export function claruBulkFileFingerprint(file: File): string {
  return JSON.stringify([file.name, file.size, file.lastModified]);
}

export function validateClaruBulkRow(
  row: ClaruBulkRow,
  rows: ClaruBulkRow[],
  project: ClaruProject,
  duplicates = countClaruBulkDuplicates(rows)
): string[] {
  const errors: string[] = [];
  const reference = row.externalRef.trim();
  if (!reference || reference.length > 200 || /[\u0000-\u001f\u007f]/.test(reference)) {
    errors.push('Enter a clip reference of at most 200 characters without control characters.');
  } else if ((duplicates.references.get(reference) ?? 0) > 1) {
    errors.push('Each clip needs a different external reference.');
  }
  if (
    project.categories.length &&
    !project.categories.some((category) => category.code === row.categoryCode)
  ) {
    errors.push('Choose an activity category.');
  }
  if (!/^[A-Z]{2}$/.test(row.country.trim().toUpperCase())) {
    errors.push('Country must use a two-letter code, such as IN.');
  }
  if (!row.collectorId.trim() || !row.siteId.trim() || !row.device.trim() || !row.mount.trim()) {
    errors.push('Collector, site, device and mount are required.');
  }
  if (!Number.isFinite(Date.parse(row.recordedAt))) {
    errors.push('Enter the actual recording date and time.');
  }
  const duration = Number(row.durationMinutes) * 60;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 86_400) {
    errors.push('Enter a positive duration of no more than 1,440 minutes.');
  }
  const fileError = claruFileError(row.video, 'video');
  if (fileError) errors.push(fileError);
  const allFiles = [row.video];
  for (const expectation of project.expectedFiles) {
    if (expectation.fileType === 'video') continue;
    const files = row.relatedFiles[expectation.fileType] ?? [];
    if (expectation.required && !files.length) {
      errors.push(`${claruFileTypeLabel(expectation.fileType)} is required.`);
    }
    if (expectation.fileType !== 'other' && files.length > 1) {
      errors.push(`Select one ${claruFileTypeLabel(expectation.fileType).toLowerCase()} file.`);
    }
    for (const file of files) {
      const problem = claruFileError(file, expectation.fileType);
      if (problem) errors.push(problem);
      allFiles.push(file);
    }
  }
  if (allFiles.length > 20) errors.push('A clip can contain at most 20 files.');
  if (new Set(allFiles.map((file) => file.name)).size !== allFiles.length) {
    errors.push('Files within a clip must have distinct filenames.');
  }
  if ((row.relatedFiles.inputs?.length ?? 0) > 0) {
    if (!validClaruAxis(row.axisConvention)) {
      errors.push('Use one direction per camera axis: R/L, U/D and F/B, such as RDF.');
    }
    if (row.videoStartUs.trim() && !Number.isSafeInteger(Number(row.videoStartUs))) {
      errors.push('Video start must be an exact whole number of microseconds.');
    }
  }
  if (
    (duplicates.files.get(claruBulkFileFingerprint(row.video)) ?? 0) > 1 &&
    !row.matchingFileConfirmed
  ) {
    errors.push(
      'A video with matching file details is selected twice. Remove the duplicate or confirm this is a separate clip.'
    );
  }
  return errors;
}

export function buildClaruBulkEntry(row: ClaruBulkRow, batch: ClaruBatch, project: ClaruProject) {
  const filesByClientPartId: Record<string, File> = {};
  const parts: ClaruSubmissionCreateInput['parts'] = [];
  const addPart = (fileType: ClaruFileType, file: File) => {
    const clientPartId = crypto.randomUUID();
    filesByClientPartId[clientPartId] = file;
    parts.push({ clientPartId, fileType, fileName: file.name, byteSize: String(file.size) });
  };
  addPart('video', row.video);
  for (const expectation of project.expectedFiles) {
    if (expectation.fileType === 'video') continue;
    for (const file of row.relatedFiles[expectation.fileType] ?? [])
      addPart(expectation.fileType, file);
  }
  const input: ClaruSubmissionCreateInput = {
    batchId: batch.id,
    externalRef: row.externalRef.trim(),
    declared: {
      ...(row.categoryCode ? { categoryCode: row.categoryCode } : {}),
      country: row.country.trim().toUpperCase(),
      collectorId: row.collectorId.trim(),
      siteId: row.siteId.trim(),
      device: row.device.trim(),
      mount: row.mount.trim(),
      recordedAt: new Date(row.recordedAt).toISOString(),
      durationSeconds: Number(row.durationMinutes) * 60,
      consent: {
        worker_consent_obtained: true,
        site_or_employer_permission_obtained: true,
        required_consent_or_notice_process_followed: true,
        footage_unedited: true,
      },
      ...((row.relatedFiles.inputs?.length ?? 0) > 0
        ? {
            imu: {
              axisConvention: row.axisConvention.trim().toUpperCase(),
              videoStartUs: row.videoStartUs.trim() ? Number(row.videoStartUs) : null,
            },
          }
        : {}),
    },
    parts,
  };
  return { input, filesByClientPartId, batchName: batch.name };
}

/** Read browser metadata without loading the video into memory or retaining an object URL. */
export function readClaruVideoDuration(file: File, signal: AbortSignal): Promise<number | null> {
  if (signal.aborted) return Promise.resolve(null);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let settled = false;
    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    const abort = () => finish(null);
    const timeout = window.setTimeout(() => finish(null), 12_000);
    signal.addEventListener('abort', abort, { once: true });
    video.preload = 'metadata';
    video.onloadedmetadata = () =>
      finish(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null);
    video.onerror = () => finish(null);
    video.src = url;
  });
}
