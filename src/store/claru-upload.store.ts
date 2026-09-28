import { create } from 'zustand';
import type { ClaruSubmissionCreateResult } from '@/types';
import { useAuthStore } from './auth.store';

// Shared across page mounts so a paused transfer can finish saving its last
// checkpoint before another instance begins a retry.
export const activeClaruTransfers = new Map<string, AbortController>();

interface PendingClaruUpload {
  result: ClaruSubmissionCreateResult;
  filesByPartId: Record<string, File>;
}

interface ClaruUploadStore {
  pendingBySubmissionId: Record<string, PendingClaruUpload>;
  stageUpload: (
    result: ClaruSubmissionCreateResult,
    filesByClientPartId: Record<string, File>
  ) => void;
  clearUpload: (submissionId: string) => void;
}

export const useClaruUploadStore = create<ClaruUploadStore>((set) => ({
  pendingBySubmissionId: {},
  stageUpload: (result, filesByClientPartId) => {
    if (!result.uploadInstructions.some((part) => part.uploadState === 'pending')) return;
    const filesByPartId = Object.fromEntries(
      result.submission.parts.flatMap((part) => {
        const file = filesByClientPartId[part.clientPartId];
        return file ? [[part.id, file]] : [];
      })
    );
    set((state) => ({
      pendingBySubmissionId: {
        ...state.pendingBySubmissionId,
        [result.submission.id]: { result, filesByPartId },
      },
    }));
  },
  clearUpload: (submissionId) =>
    set((state) => {
      const next = { ...state.pendingBySubmissionId };
      delete next[submissionId];
      return { pendingBySubmissionId: next };
    }),
}));

// Signed URLs and local files belong only to the current authenticated session.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    activeClaruTransfers.forEach((controller) => controller.abort());
    useClaruUploadStore.setState({ pendingBySubmissionId: {} });
  }
});
