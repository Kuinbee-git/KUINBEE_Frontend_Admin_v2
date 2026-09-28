import type { ClaruSubmission, ClaruSubmissionCreateInput } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { activeClaruTransfers, useClaruUploadStore } from '@/store/claru-upload.store';
import {
  useClaruQueueStore,
  type ClaruQueueEntry,
  type ClaruQueueItem,
} from '@/store/claru-queue.store';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { createClaruSubmission } from './claru.service';
import { uploadClaruSubmissionFiles } from './claru-upload.service';

export type { ClaruQueueEntry, ClaruQueueItem, ClaruQueueStatus } from '@/store/claru-queue.store';

const STORAGE_KEY = 'kuinbee:claru-upload-queue:v1';
// A clip can already run four multipart workers. One active clip keeps bandwidth
// predictable and lets all remaining clips continue after an individual failure.
const CLIP_CONCURRENCY = 1;
const running = new Map<string, AbortController>();
const listeners = new Set<(submission: ClaruSubmission) => void>();
let generation = 0;
let scheduled = false;
let suspendPersistence = false;

// Claru references identify a clip across the entire supplier team, including
// other projects/batches. Keep the batch argument for existing caller symmetry.
export const claruQueueTransferKey = (_batchId: string, externalRef: string) =>
  `claru-ref:${externalRef}`;

function canManage() {
  const { user, permissions } = useAuthStore.getState();
  return Boolean(
    user &&
    (user.userType === 'SUPERADMIN' ||
      (user.userType === 'ADMIN' && permissions.includes('MANAGE_CLARU_DELIVERIES')))
  );
}

function requireOwner() {
  const ownerId = useAuthStore.getState().user?.id;
  if (!ownerId || !canManage()) throw new Error('You need permission to manage Claru deliveries.');
  if (useClaruQueueStore.getState().ownerId !== ownerId) restoreClaruQueue(ownerId);
  return ownerId;
}

function patchItem(id: string, patch: Partial<ClaruQueueItem>) {
  useClaruQueueStore.setState((state) => ({
    items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

function exactFiles(
  input: ClaruSubmissionCreateInput,
  files: Record<string, File>,
  uploadedIds: string[] = []
) {
  for (const part of input.parts) {
    if (uploadedIds.includes(part.clientPartId) && !files[part.clientPartId]) continue;
    const file = files[part.clientPartId];
    if (!file || file.name !== part.fileName || String(file.size) !== part.byteSize) {
      throw new Error(`Reselect ${part.fileName} with the original filename and byte size.`);
    }
  }
}

function persistentInput(input: ClaruSubmissionCreateInput): ClaruSubmissionCreateInput {
  const { declared } = input;
  return {
    batchId: input.batchId,
    externalRef: input.externalRef,
    declared: {
      categoryCode: declared.categoryCode,
      country: declared.country,
      collectorId: declared.collectorId,
      siteId: declared.siteId,
      device: declared.device,
      mount: declared.mount,
      recordedAt: declared.recordedAt,
      durationSeconds: declared.durationSeconds,
      consent: {
        worker_consent_obtained: declared.consent.worker_consent_obtained,
        site_or_employer_permission_obtained: declared.consent.site_or_employer_permission_obtained,
        required_consent_or_notice_process_followed:
          declared.consent.required_consent_or_notice_process_followed,
        footage_unedited: declared.consent.footage_unedited,
      },
      imu: declared.imu
        ? { axisConvention: declared.imu.axisConvention, videoStartUs: declared.imu.videoStartUs }
        : undefined,
      batchRef: declared.batchRef,
    },
    parts: input.parts.map(({ clientPartId, fileType, fileName, byteSize }) => ({
      clientPartId,
      fileType,
      fileName,
      byteSize,
    })),
  };
}

function persistQueue() {
  if (suspendPersistence || typeof window === 'undefined') return;
  const { ownerId, items } = useClaruQueueStore.getState();
  try {
    if (!ownerId || items.length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        ownerId,
        items: items.map((item) => ({
          id: item.id,
          ownerId,
          input: persistentInput(item.input),
          batchName: item.batchName,
          status: item.status,
          submissionId: item.submissionId,
          uploadedClientPartIds: item.uploadedClientPartIds,
          createdAt: item.createdAt,
        })),
      })
    );
  } catch {
    // Storage may be disabled or full; the in-memory queue remains usable.
  }
}

function isSavedItem(value: unknown): value is ClaruQueueItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ClaruQueueItem>;
  const input = item.input;
  return Boolean(
    typeof item.id === 'string' &&
    typeof item.ownerId === 'string' &&
    typeof item.createdAt === 'string' &&
    input &&
    typeof input.batchId === 'string' &&
    typeof input.externalRef === 'string' &&
    input.declared &&
    typeof input.declared.durationSeconds === 'number' &&
    Number.isFinite(input.declared.durationSeconds) &&
    input.declared.durationSeconds > 0 &&
    ['country', 'collectorId', 'siteId', 'device', 'mount', 'recordedAt'].every(
      (key) => typeof (input.declared as unknown as Record<string, unknown>)[key] === 'string'
    ) &&
    input.declared.consent &&
    input.declared.consent.worker_consent_obtained === true &&
    input.declared.consent.site_or_employer_permission_obtained === true &&
    input.declared.consent.required_consent_or_notice_process_followed === true &&
    input.declared.consent.footage_unedited === true &&
    Array.isArray(input.parts) &&
    input.parts.length > 0 &&
    input.parts.every(
      (part) =>
        part &&
        typeof part.clientPartId === 'string' &&
        ['video', 'inputs', 'frames', 'video_right', 'calibration', 'other'].includes(
          part.fileType
        ) &&
        typeof part.fileName === 'string' &&
        typeof part.byteSize === 'string' &&
        /^\d+$/.test(part.byteSize)
    )
  );
}

export function restoreClaruQueue(ownerId: string) {
  // Never restore metadata under an identity supplied independently of auth.
  if (useAuthStore.getState().user?.id !== ownerId) return;
  if (useClaruQueueStore.getState().ownerId === ownerId) return;
  let items: ClaruQueueItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved?.version === 1 && saved.ownerId === ownerId && Array.isArray(saved.items)) {
        items = saved.items
          .filter(isSavedItem)
          .filter((item: ClaruQueueItem) => item.ownerId === ownerId)
          .map((item: ClaruQueueItem) => ({
            id: item.id,
            ownerId,
            createdAt: item.createdAt,
            batchName: typeof item.batchName === 'string' ? item.batchName : undefined,
            submissionId: typeof item.submissionId === 'string' ? item.submissionId : undefined,
            input: persistentInput(item.input),
            filesByClientPartId: {},
            progressByPartId: {},
            uploadedClientPartIds: Array.isArray(item.uploadedClientPartIds)
              ? item.uploadedClientPartIds.filter(
                  (id) =>
                    typeof id === 'string' &&
                    item.input.parts.some((part) => part.clientPartId === id)
                )
              : [],
            status:
              item.status === 'ready' || item.status === 'submitted'
                ? item.status
                : Array.isArray(item.uploadedClientPartIds) &&
                    item.input.parts.every((part) =>
                      item.uploadedClientPartIds.includes(part.clientPartId)
                    )
                  ? 'paused'
                  : 'needs_files',
            error: undefined,
          }));
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore corrupted or unavailable session storage.
    }
  }
  useClaruQueueStore.setState({ ownerId, items, isPaused: true });
}

export function enqueueClaruClips(entries: ClaruQueueEntry[]): string[] {
  const ownerId = requireOwner();
  const existing = useClaruQueueStore.getState().items;
  const refs = new Set(
    existing.map((item) => claruQueueTransferKey(item.input.batchId, item.input.externalRef))
  );
  const next = entries.map((entry) => {
    const ref = claruQueueTransferKey(entry.input.batchId, entry.input.externalRef);
    if (refs.has(ref))
      throw new Error(`Reference ${entry.input.externalRef} is already in the upload queue.`);
    refs.add(ref);
    exactFiles(entry.input, entry.filesByClientPartId);
    return {
      id: crypto.randomUUID(),
      ownerId,
      input: persistentInput(entry.input),
      batchName: entry.batchName,
      filesByClientPartId: { ...entry.filesByClientPartId },
      status: 'queued' as const,
      progressByPartId: {},
      uploadedClientPartIds: [],
      createdAt: new Date().toISOString(),
    };
  });
  useClaruQueueStore.setState({ items: [...existing, ...next] });
  return next.map((item) => item.id);
}

function notifySubmission(submission: ClaruSubmission) {
  recordClaruQueueSubmission(submission);
  listeners.forEach((listener) => {
    try {
      listener(submission);
    } catch {
      // Rendering/cache listeners must not fail an otherwise valid transfer.
    }
  });
}

/** Reflect a manually sealed clip in the queue; this never submits a clip. */
export function recordClaruQueueSubmission(submission: ClaruSubmission) {
  if (
    !submission.sealed ||
    useClaruQueueStore.getState().ownerId !== useAuthStore.getState().user?.id
  )
    return;
  useClaruQueueStore.setState((state) => ({
    items: state.items.map((item) =>
      item.submissionId === submission.id && item.status === 'ready'
        ? { ...item, status: 'submitted' as const, filesByClientPartId: {}, error: undefined }
        : item
    ),
  }));
}

export function subscribeClaruQueueUpdates(listener: (submission: ClaruSubmission) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    const state = useClaruQueueStore.getState();
    if (state.isPaused || !canManage() || running.size >= CLIP_CONCURRENCY) return;
    const item = state.items.find((candidate) => candidate.status === 'queued');
    if (item) void runItem(item);
  });
}

async function runItem(item: ClaruQueueItem) {
  const controller = new AbortController();
  const runGeneration = generation;
  const ownerId = item.ownerId;
  const current = () =>
    generation === runGeneration &&
    useAuthStore.getState().user?.id === ownerId &&
    useClaruQueueStore.getState().ownerId === ownerId;
  const locks: string[] = [];
  const claim = (key: string) => {
    const existing = activeClaruTransfers.get(key);
    if (existing && existing !== controller) {
      throw new Error(
        'This clip has another transfer saving progress. Pause it and retry after it finishes.'
      );
    }
    activeClaruTransfers.set(key, controller);
    locks.push(key);
  };
  running.set(item.id, controller);
  patchItem(item.id, { status: 'creating', error: undefined });
  try {
    claim(claruQueueTransferKey(item.input.batchId, item.input.externalRef));
    const stagedSingle = Object.values(useClaruUploadStore.getState().pendingBySubmissionId).find(
      (entry) => entry.result.submission.externalRef === item.input.externalRef
    );
    const knownId = item.submissionId ?? stagedSingle?.result.submission.id;
    if (knownId) claim(knownId);
    if (stagedSingle && stagedSingle.result.submission.batchId !== item.input.batchId) {
      throw new Error(
        `Reference ${item.input.externalRef} already belongs to another batch. Use a unique reference for this clip.`
      );
    }
    const refreshed = await createClaruSubmission(item.input, { signal: controller.signal });
    if (!current()) return;
    claim(refreshed.submission.id);
    const uploadedClientPartIds = refreshed.submission.parts
      .filter((part) => part.uploadState === 'uploaded')
      .map((part) => part.clientPartId);
    patchItem(item.id, { submissionId: refreshed.submission.id, uploadedClientPartIds });
    notifySubmission(refreshed.submission);
    if (controller.signal.aborted) {
      patchItem(item.id, { status: 'paused' });
      return;
    }
    if (refreshed.submission.sealed) {
      patchItem(item.id, { status: 'submitted', filesByClientPartId: {} });
      return;
    }
    try {
      exactFiles(item.input, item.filesByClientPartId, uploadedClientPartIds);
    } catch (error) {
      patchItem(item.id, {
        status: 'needs_files',
        error: getFriendlyErrorMessage(error),
        filesByClientPartId: {},
      });
      return;
    }
    const filesByPartId = Object.fromEntries(
      refreshed.submission.parts.flatMap((part) => {
        const file = item.filesByClientPartId[part.clientPartId];
        return file ? [[part.id, file]] : [];
      })
    );
    patchItem(item.id, { status: 'uploading', progressByPartId: {} });
    const submission = await uploadClaruSubmissionFiles({
      staged: refreshed,
      filesByPartId,
      signal: controller.signal,
      onProgress: (progress) => {
        if (!current()) return;
        const latest = useClaruQueueStore.getState().items.find((entry) => entry.id === item.id);
        if (!latest) return;
        const part = refreshed.submission.parts.find((entry) => entry.id === progress.partId);
        const newlyCompleted =
          part &&
          progress.phase === 'completed' &&
          !latest.uploadedClientPartIds.includes(part.clientPartId);
        patchItem(item.id, {
          progressByPartId: { ...latest.progressByPartId, [progress.partId]: progress },
          uploadedClientPartIds: newlyCompleted
            ? [...latest.uploadedClientPartIds, part.clientPartId]
            : latest.uploadedClientPartIds,
        });
      },
    });
    if (!current()) return;
    notifySubmission(submission);
    patchItem(item.id, {
      status: submission.sealed ? 'submitted' : 'ready',
      uploadedClientPartIds: submission.parts
        .filter((part) => part.uploadState === 'uploaded')
        .map((part) => part.clientPartId),
      filesByClientPartId: {},
      error: undefined,
    });
    useClaruUploadStore.getState().clearUpload(submission.id);
  } catch (error) {
    if (current()) {
      patchItem(item.id, {
        status: controller.signal.aborted ? 'paused' : 'failed',
        error: controller.signal.aborted ? undefined : getFriendlyErrorMessage(error),
      });
    }
  } finally {
    // The upload engine drains all multipart checkpoints before settling. Keep
    // both reference and submission locks until that drain has finished.
    locks.forEach((key) => {
      if (activeClaruTransfers.get(key) === controller) activeClaruTransfers.delete(key);
    });
    if (running.get(item.id) === controller) running.delete(item.id);
    schedule();
  }
}

export function startClaruQueue() {
  requireOwner();
  useClaruQueueStore.setState((state) => ({
    isPaused: false,
    items: state.items.map((item) =>
      item.status === 'paused' ? { ...item, status: 'queued' as const, error: undefined } : item
    ),
  }));
  schedule();
}

export function pauseClaruQueue() {
  useClaruQueueStore.setState((state) => ({
    isPaused: true,
    items: state.items.map((item) => {
      if (running.has(item.id)) return { ...item, status: 'pausing' as const };
      return item.status === 'queued' ? { ...item, status: 'paused' as const } : item;
    }),
  }));
  running.forEach((controller) => controller.abort());
}

export function pauseClaruQueueItem(id: string) {
  const item = useClaruQueueStore.getState().items.find((entry) => entry.id === id);
  if (!item) return;
  if (running.has(id)) {
    patchItem(id, { status: 'pausing' });
    running.get(id)?.abort();
  } else if (item.status === 'queued') {
    patchItem(id, { status: 'paused' });
  }
}

export function resumeClaruQueueItem(id: string) {
  requireOwner();
  if (running.has(id))
    throw new Error('The clip is saving its last checkpoint. Resume it in a moment.');
  const item = useClaruQueueStore.getState().items.find((entry) => entry.id === id);
  if (!item || item.status === 'ready' || item.status === 'submitted') return;
  exactFiles(item.input, item.filesByClientPartId, item.uploadedClientPartIds);
  patchItem(id, { status: 'queued', error: undefined });
  useClaruQueueStore.setState({ isPaused: false });
  schedule();
}

export const retryClaruQueueItem = resumeClaruQueueItem;

export function attachClaruQueueFiles(id: string, filesByClientPartId: Record<string, File>) {
  requireOwner();
  if (running.has(id)) throw new Error('Pause the clip before selecting its files again.');
  const item = useClaruQueueStore.getState().items.find((entry) => entry.id === id);
  if (!item || item.status === 'ready' || item.status === 'submitted') return;
  exactFiles(item.input, filesByClientPartId, item.uploadedClientPartIds);
  patchItem(id, {
    filesByClientPartId: { ...filesByClientPartId },
    status: 'paused',
    error: undefined,
  });
}

export function removeClaruQueueItem(id: string) {
  requireOwner();
  if (running.has(id))
    throw new Error('Pause the clip and wait for its saved progress before removing it.');
  useClaruQueueStore.setState((state) => ({ items: state.items.filter((item) => item.id !== id) }));
}

useClaruQueueStore.subscribe((state, previous) => {
  const changed =
    state.ownerId !== previous.ownerId ||
    state.items.length !== previous.items.length ||
    state.items.some((item, index) => {
      const prior = previous.items[index];
      return (
        !prior ||
        prior.id !== item.id ||
        prior.status !== item.status ||
        prior.submissionId !== item.submissionId ||
        prior.input !== item.input ||
        prior.uploadedClientPartIds !== item.uploadedClientPartIds
      );
    });
  if (changed) persistQueue();
  schedule();
});

useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    generation += 1;
    running.forEach((controller) => controller.abort());
    suspendPersistence = true;
    useClaruQueueStore.setState({ ownerId: null, items: [], isPaused: true });
    if (state.user) restoreClaruQueue(state.user.id);
    suspendPersistence = false;
    persistQueue();
  } else if (!canManage()) {
    pauseClaruQueue();
  }
});

if (useAuthStore.getState().user) restoreClaruQueue(useAuthStore.getState().user!.id);
