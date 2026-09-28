'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { claruKeys } from '@/hooks/api/useClaru';
import {
  type ClaruTransferProgress,
  uploadClaruSubmissionFiles,
} from '@/services/claru-upload.service';
import { createClaruSubmission } from '@/services/claru.service';
import { claruQueueTransferKey } from '@/services/claru-queue.service';
import { activeClaruTransfers, useClaruUploadStore } from '@/store/claru-upload.store';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { formatBytes } from './claruAdminUtils';

export function ClaruTransferPanel({ submissionId }: { submissionId: string }) {
  const client = useQueryClient();
  const staged = useClaruUploadStore((state) => state.pendingBySubmissionId[submissionId]);
  const stageUpload = useClaruUploadStore((state) => state.stageUpload);
  const clearUpload = useClaruUploadStore((state) => state.clearUpload);
  const [progressByPartId, setProgressByPartId] = useState<Record<string, ClaruTransferProgress>>(
    {}
  );
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setPaused] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (!isUploading) return;
    const guardNavigation = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', guardNavigation);
    return () => window.removeEventListener('beforeunload', guardNavigation);
  }, [isUploading]);

  const progressItems = useMemo(
    () =>
      staged?.result.submission.parts.map(
        (part) =>
          progressByPartId[part.id] ??
          ({
            partId: part.id,
            fileName: part.fileName,
            uploadedBytes: part.uploadState === 'uploaded' ? Number(part.byteSize) : 0,
            totalBytes: Number(part.byteSize),
            phase: part.uploadState === 'uploaded' ? 'completed' : 'queued',
          } satisfies ClaruTransferProgress)
      ) ?? [],
    [progressByPartId, staged]
  );
  const totals = useMemo(
    () =>
      progressItems.reduce(
        (current, item) => ({
          uploaded: current.uploaded + item.uploadedBytes,
          total: current.total + item.totalBytes,
        }),
        { uploaded: 0, total: 0 }
      ),
    [progressItems]
  );
  const overallPercent = totals.total > 0 ? Math.round((totals.uploaded / totals.total) * 100) : 0;

  if (!staged || staged.result.uploadInstructions.length === 0) return null;

  const startUpload = async () => {
    if (controllerRef.current) return;
    const referenceKey = claruQueueTransferKey(
      staged.result.submission.batchId,
      staged.result.submission.externalRef
    );
    if (activeClaruTransfers.has(submissionId) || activeClaruTransfers.has(referenceKey)) {
      toast.info('The previous transfer is saving its last checkpoint. Try again in a moment.');
      return;
    }
    const controller = new AbortController();
    activeClaruTransfers.set(submissionId, controller);
    activeClaruTransfers.set(referenceKey, controller);
    controllerRef.current = controller;
    setError(null);
    setPaused(false);
    setUploading(true);
    let activeStaged = staged;
    setProgressByPartId(
      Object.fromEntries(
        staged.result.submission.parts.map((part) => [
          part.id,
          {
            partId: part.id,
            fileName: part.fileName,
            uploadedBytes: part.uploadState === 'uploaded' ? Number(part.byteSize) : 0,
            totalBytes: Number(part.byteSize),
            phase: part.uploadState === 'uploaded' ? 'completed' : 'queued',
          } satisfies ClaruTransferProgress,
        ])
      )
    );

    try {
      const filesByClientPartId = Object.fromEntries(
        activeStaged.result.submission.parts.flatMap((part) => {
          const file = activeStaged.filesByPartId[part.id];
          return file ? [[part.clientPartId, file]] : [];
        })
      );
      const refreshed = await createClaruSubmission(
        {
          batchId: activeStaged.result.submission.batchId,
          externalRef: activeStaged.result.submission.externalRef,
          declared: activeStaged.result.submission.declared,
          parts: activeStaged.result.submission.parts.map((part) => ({
            clientPartId: part.clientPartId,
            fileType: part.fileType,
            fileName: part.fileName,
            byteSize: part.byteSize,
          })),
        },
        { signal: controller.signal }
      );
      if (controller.signal.aborted) {
        setPaused(true);
        return;
      }
      stageUpload(refreshed, filesByClientPartId);
      client.setQueryData(claruKeys.submission(submissionId), refreshed.submission);
      activeStaged = {
        result: refreshed,
        filesByPartId: Object.fromEntries(
          refreshed.submission.parts.flatMap((part) => {
            const file = filesByClientPartId[part.clientPartId];
            return file ? [[part.id, file]] : [];
          })
        ),
      };
      const submission = await uploadClaruSubmissionFiles({
        staged: activeStaged.result,
        filesByPartId: activeStaged.filesByPartId,
        signal: controller.signal,
        onProgress: (progress) =>
          setProgressByPartId((current) => ({ ...current, [progress.partId]: progress })),
      });
      client.setQueryData(claruKeys.submission(submission.id), submission);
      await Promise.all([
        client.invalidateQueries({ queryKey: claruKeys.submissions() }),
        client.invalidateQueries({ queryKey: claruKeys.batches() }),
      ]);
      clearUpload(submissionId);
      toast.success(
        submission.sealed
          ? 'This submission is already sealed'
          : 'Files uploaded. The submission is ready to seal.'
      );
    } catch (uploadError) {
      const paused = controller.signal.aborted;
      const message = paused
        ? 'Paused. Completed files and saved slices will be kept.'
        : getFriendlyErrorMessage(uploadError);
      setPaused(paused);
      setError(paused ? null : message);
      setProgressByPartId((current) =>
        Object.fromEntries(
          Object.entries(current).map(([partId, progress]) => [
            partId,
            progress.phase === 'uploading' || progress.phase === 'completing'
              ? {
                  ...progress,
                  phase: paused ? ('paused' as const) : ('failed' as const),
                  detail: message,
                }
              : progress,
          ])
        )
      );
    } finally {
      if (activeClaruTransfers.get(submissionId) === controller)
        activeClaruTransfers.delete(submissionId);
      if (activeClaruTransfers.get(referenceKey) === controller)
        activeClaruTransfers.delete(referenceKey);
      controllerRef.current = null;
      setUploading(false);
    }
  };

  return (
    <Card className="border-[var(--status-info-border)] shadow-[var(--shadow-card)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold" role="status">
              {isUploading
                ? 'Uploading files'
                : isPaused
                  ? 'Upload paused'
                  : error
                    ? 'Upload needs attention'
                    : 'Files ready to upload'}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
              Files go directly from this browser to Claru storage. Keep this page open while the
              transfer is running. Leaving this page pauses the transfer. After a browser refresh,
              reselect the same files to resume from saved progress.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isUploading ? (
              <Button variant="outline" onClick={() => controllerRef.current?.abort()}>
                Pause upload
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => clearUpload(submissionId)}>
                  Reselect files
                </Button>
                <Button onClick={startUpload}>
                  {error ? 'Retry upload' : isPaused ? 'Resume upload' : 'Start upload'}
                </Button>
              </>
            )}
          </div>
        </div>

        {progressItems.length > 0 ? (
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <span>Overall progress</span>
                <span>
                  {formatBytes(totals.uploaded)} / {formatBytes(totals.total)} · {overallPercent}%
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]"
                role="progressbar"
                aria-label="Overall upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overallPercent}
              >
                <div
                  className="h-full rounded-full bg-[var(--action-primary)] transition-[width]"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {progressItems.map((progress) => {
                const percent =
                  progress.totalBytes > 0
                    ? Math.round((progress.uploadedBytes / progress.totalBytes) * 100)
                    : 0;
                return (
                  <div
                    key={progress.partId}
                    className="rounded-lg border p-3"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{progress.fileName}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {progress.phase === 'queued'
                            ? 'Waiting'
                            : progress.phase === 'uploading'
                              ? progress.detail || 'Uploading to Claru storage'
                              : progress.phase === 'completing'
                                ? progress.detail
                                : progress.phase === 'completed'
                                  ? 'Stored and confirmed'
                                  : progress.detail || 'Upload stopped'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">{percent}%</span>
                    </div>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]"
                      role="progressbar"
                      aria-label={`Upload ${progress.fileName}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${percent}%`,
                          backgroundColor:
                            progress.phase === 'failed'
                              ? 'var(--status-error)'
                              : 'var(--action-primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            className="mt-4 rounded-md border px-3 py-2 text-sm"
            role="alert"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error)',
            }}
          >
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
