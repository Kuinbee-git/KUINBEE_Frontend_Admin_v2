import type {
  ClaruPartUploadInstruction,
  ClaruStoredPart,
  ClaruSubmission,
  ClaruSubmissionCreateResult,
} from '@/types';
import { checkpointClaruPart, completeClaruPart } from './claru.service';

const configuredTimeout = Number(process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT_MS);
const UPLOAD_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 10 * 60 * 1000;
const MULTIPART_CONCURRENCY = 4;

export type ClaruTransferPhase =
  | 'queued'
  | 'uploading'
  | 'completing'
  | 'completed'
  | 'paused'
  | 'failed';

export interface ClaruTransferProgress {
  partId: string;
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  phase: ClaruTransferPhase;
  detail?: string;
}

export class ClaruUploadError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 0) {
    super(message);
    this.name = 'ClaruUploadError';
    this.statusCode = statusCode;
  }
}

interface PutObjectArgs {
  url: string;
  body: Blob;
  headers: Record<string, string>;
  signal: AbortSignal;
  onProgress: (uploadedBytes: number) => void;
  requireEtag?: boolean;
}

function putObject({
  url,
  body,
  headers,
  signal,
  onProgress,
  requireEtag = false,
}: PutObjectArgs): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timeoutMessage = 'The storage upload timed out. Resume the clip to request fresh URLs.';
    const abort = () => xhr.abort();
    const cleanup = () => signal.removeEventListener('abort', abort);

    xhr.open('PUT', url);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    });
    xhr.addEventListener('load', () => {
      cleanup();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ClaruUploadError(
            `Storage rejected ${body.size.toLocaleString()} bytes with status ${xhr.status}. Resume the upload to retry.`,
            xhr.status
          )
        );
        return;
      }
      onProgress(body.size);
      const etag = xhr.getResponseHeader('ETag');
      if (requireEtag && !etag) {
        reject(
          new ClaruUploadError(
            'Storage completed the slice but did not expose its ETag. Claru storage CORS must expose the ETag response header.'
          )
        );
        return;
      }
      resolve(etag);
    });
    xhr.addEventListener('error', () => {
      cleanup();
      reject(
        new ClaruUploadError(
          'The browser could not reach Claru storage. Check storage CORS and the network connection.'
        )
      );
    });
    xhr.addEventListener('timeout', () => {
      cleanup();
      reject(new ClaruUploadError(timeoutMessage));
    });
    xhr.addEventListener('abort', () => {
      cleanup();
      reject(new ClaruUploadError('Upload paused. Resume it when you are ready.'));
    });

    if (signal.aborted) {
      reject(new ClaruUploadError('Upload paused. Resume it when you are ready.'));
      return;
    }
    signal.addEventListener('abort', abort, { once: true });

    const hasDeclaredContentType = Object.keys(headers).some(
      (name) => name.toLowerCase() === 'content-type'
    );
    xhr.send(hasDeclaredContentType || !body.type ? body : body.slice(0, body.size, ''));
  });
}

const uploadedCheckpointMap = (storedPart: ClaruStoredPart) =>
  new Map(storedPart.uploadedParts.map((part) => [part.partNumber, part.etag]));

async function uploadMultipart(args: {
  submissionId: string;
  storedPart: ClaruStoredPart;
  instruction: Extract<ClaruPartUploadInstruction['upload'], { kind: 'multipart' }>;
  file: File;
  signal: AbortSignal;
  onProgress: (uploadedBytes: number, detail: string) => void;
}) {
  const { submissionId, storedPart, instruction, file, onProgress } = args;
  const workersController = new AbortController();
  const stopWorkers = () => workersController.abort();
  const signal = workersController.signal;
  if (args.signal.aborted) stopWorkers();
  else args.signal.addEventListener('abort', stopWorkers, { once: true });
  const completed = uploadedCheckpointMap(storedPart);
  const progressByPart = new Map<number, number>();
  const sizeForPart = (partNumber: number) => {
    const start = (partNumber - 1) * instruction.partSizeBytes;
    return Math.max(0, Math.min(instruction.partSizeBytes, file.size - start));
  };
  completed.forEach((_etag, partNumber) => progressByPart.set(partNumber, sizeForPart(partNumber)));

  const emit = () => {
    const uploaded = Array.from(progressByPart.values()).reduce((total, value) => total + value, 0);
    onProgress(
      uploaded,
      `${completed.size}/${instruction.parts.length} multipart slices checkpointed`
    );
  };
  emit();

  const remaining = instruction.parts.filter((part) => !completed.has(part.partNumber));
  let cursor = 0;
  const worker = async () => {
    while (cursor < remaining.length) {
      if (signal.aborted) throw new ClaruUploadError('Upload paused.');
      const item = remaining[cursor];
      cursor += 1;
      if (!item) return;
      const start = (item.partNumber - 1) * instruction.partSizeBytes;
      const end = Math.min(start + instruction.partSizeBytes, file.size);
      const chunk = file.slice(start, end, '');
      const etag = await putObject({
        url: item.url,
        body: chunk,
        headers: instruction.headers,
        signal,
        requireEtag: true,
        onProgress: (loaded) => {
          progressByPart.set(item.partNumber, loaded);
          emit();
        },
      });
      await checkpointClaruPart({
        submissionId,
        partId: storedPart.id,
        uploadId: instruction.uploadId,
        partNumber: item.partNumber,
        etag: etag!,
      });
      completed.set(item.partNumber, etag!);
      progressByPart.set(item.partNumber, chunk.size);
      emit();
    }
  };

  // Abort siblings on the first failure, then drain every worker/checkpoint before
  // allowing a retry to refresh the multipart upload. No old worker can write later.
  let firstFailure: unknown;
  try {
    await Promise.allSettled(
      Array.from({ length: Math.min(MULTIPART_CONCURRENCY, remaining.length) }, async () => {
        try {
          await worker();
        } catch (error) {
          firstFailure ??= error;
          stopWorkers();
        }
      })
    );
    if (firstFailure) throw firstFailure;
    if (signal.aborted) throw new ClaruUploadError('Upload paused.');
  } finally {
    args.signal.removeEventListener('abort', stopWorkers);
  }
}

export async function uploadClaruSubmissionFiles(args: {
  staged: ClaruSubmissionCreateResult;
  filesByPartId: Record<string, File>;
  signal: AbortSignal;
  onProgress: (progress: ClaruTransferProgress) => void;
}): Promise<ClaruSubmission> {
  const { staged, filesByPartId, signal, onProgress } = args;
  let latest = staged.submission;

  for (const instruction of staged.uploadInstructions) {
    if (signal.aborted) throw new ClaruUploadError('Upload paused.');
    const storedPart = latest.parts.find((part) => part.id === instruction.localPartId);
    if (!storedPart) {
      throw new ClaruUploadError('The local file no longer matches the Claru submission.');
    }
    if (instruction.uploadState === 'uploaded') {
      onProgress({
        partId: storedPart.id,
        fileName: storedPart.fileName,
        uploadedBytes: Number(storedPart.byteSize),
        totalBytes: Number(storedPart.byteSize),
        phase: 'completed',
      });
      continue;
    }

    const file = filesByPartId[storedPart.id];
    if (!file || file.name !== storedPart.fileName || String(file.size) !== storedPart.byteSize) {
      throw new ClaruUploadError(
        `Reselect ${storedPart.fileName} with the exact declared name and byte size.`
      );
    }
    if (!instruction.upload) {
      throw new ClaruUploadError(
        `Claru did not return upload instructions for ${storedPart.fileName}. Resume the submission.`
      );
    }

    const report = (uploadedBytes: number, phase: ClaruTransferPhase, detail?: string) =>
      onProgress({
        partId: storedPart.id,
        fileName: storedPart.fileName,
        uploadedBytes,
        totalBytes: file.size,
        phase,
        detail,
      });

    report(0, 'uploading');
    if (instruction.upload.kind === 'put') {
      await putObject({
        url: instruction.upload.url,
        body: file,
        headers: instruction.upload.headers,
        signal,
        onProgress: (loaded) => report(loaded, 'uploading'),
      });
    } else {
      await uploadMultipart({
        submissionId: latest.id,
        storedPart,
        instruction: instruction.upload,
        file,
        signal,
        onProgress: (loaded, detail) => report(loaded, 'uploading', detail),
      });
    }

    if (signal.aborted) throw new ClaruUploadError('Upload paused.');
    report(file.size, 'completing', 'Confirming the stored object with Claru');
    latest = await completeClaruPart({ submissionId: latest.id, partId: storedPart.id });
    report(file.size, 'completed');
  }

  return latest;
}
