import { create } from 'zustand';
import type { ClaruSubmissionCreateInput } from '@/types';
import type { ClaruTransferProgress } from '@/services/claru-upload.service';

export type ClaruQueueStatus =
  | 'queued'
  | 'creating'
  | 'uploading'
  | 'pausing'
  | 'paused'
  | 'failed'
  | 'needs_files'
  | 'ready'
  | 'submitted';

export interface ClaruQueueEntry {
  input: ClaruSubmissionCreateInput;
  filesByClientPartId: Record<string, File>;
  batchName?: string;
}

export interface ClaruQueueItem extends ClaruQueueEntry {
  id: string;
  ownerId: string;
  status: ClaruQueueStatus;
  submissionId?: string;
  progressByPartId: Record<string, ClaruTransferProgress>;
  uploadedClientPartIds: string[];
  error?: string;
  createdAt: string;
}

interface ClaruQueueState {
  ownerId: string | null;
  items: ClaruQueueItem[];
  isPaused: boolean;
}

// File references live only in memory. Persistence is explicitly selected by the
// queue service so neither browser files nor signed storage URLs reach storage.
export const useClaruQueueStore = create<ClaruQueueState>(() => ({
  ownerId: null,
  items: [],
  isPaused: true,
}));
