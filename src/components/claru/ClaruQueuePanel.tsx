'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CloudUpload, Loader2, Pause, Play, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge, type SemanticStatus } from '@/components/shared/StatusBadge';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import {
  attachClaruQueueFiles,
  pauseClaruQueue,
  pauseClaruQueueItem,
  removeClaruQueueItem,
  resumeClaruQueueItem,
  retryClaruQueueItem,
  startClaruQueue,
} from '@/services/claru-queue.service';
import { useClaruQueueStore, type ClaruQueueItem } from '@/store/claru-queue.store';
import { claruFileTypeLabel, formatBytes } from './claruAdminUtils';
import { claruAcceptByType } from './claruFormUtils';

const activeStates = ['creating', 'uploading', 'pausing'];
const finishedStates = ['ready', 'submitted'];
const labels: Record<ClaruQueueItem['status'], { text: string; semantic: SemanticStatus }> = {
  queued: { text: 'Waiting', semantic: 'neutral' },
  creating: { text: 'Preparing', semantic: 'in_progress' },
  uploading: { text: 'Uploading', semantic: 'in_progress' },
  pausing: { text: 'Saving progress', semantic: 'in_progress' },
  paused: { text: 'Paused', semantic: 'warning' },
  failed: { text: 'Needs attention', semantic: 'error' },
  needs_files: { text: 'Reselect files', semantic: 'warning' },
  ready: { text: 'Ready to seal', semantic: 'success' },
  submitted: { text: 'Already submitted', semantic: 'success' },
};

function progressFor(item: ClaruQueueItem) {
  const total = item.input.parts.reduce((sum, part) => sum + Number(part.byteSize), 0);
  const uploaded = finishedStates.includes(item.status)
    ? total
    : Math.min(
        total,
        Object.values(item.progressByPartId).reduce((sum, part) => sum + part.uploadedBytes, 0)
      );
  return {
    total,
    uploaded,
    percent: total ? Math.min(100, Math.round((uploaded / total) * 100)) : 0,
  };
}

function QueueFilesDialog({ item, onClose }: { item: ClaruQueueItem | null; onClose: () => void }) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) {
          setFiles({});
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Reselect original clip files</DialogTitle>
          <DialogDescription>
            Choose the same files for {item?.input.externalRef}. Saved upload checkpoints will be
            reused.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {item?.input.parts
            .filter((part) => !item.uploadedClientPartIds.includes(part.clientPartId))
            .map((part) => (
              <div key={part.clientPartId} className="space-y-2">
                <Label htmlFor={`queue-file-${part.clientPartId}`}>
                  {claruFileTypeLabel(part.fileType)} · {part.fileName}
                </Label>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatBytes(Number(part.byteSize))} · Original filename and size must match.
                </p>
                <Input
                  id={`queue-file-${part.clientPartId}`}
                  type="file"
                  accept={claruAcceptByType[part.fileType]}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setFiles((current) => {
                      const next = { ...current };
                      if (file) next[part.clientPartId] = file;
                      else delete next[part.clientPartId];
                      return next;
                    });
                    setError(null);
                  }}
                />
              </div>
            ))}
          {error ? (
            <p role="alert" className="text-sm text-[var(--status-error)]">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFiles({});
              setError(null);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!item) return;
              try {
                attachClaruQueueFiles(item.id, files);
                setFiles({});
                setError(null);
                onClose();
              } catch (failure) {
                setError(getFriendlyErrorMessage(failure));
              }
            }}
          >
            Restore files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClaruQueuePanel({
  batchId,
  onNavigate,
}: {
  batchId?: string;
  onNavigate?: () => void;
}) {
  const { user, can } = useAuthorization();
  const ownerId = useClaruQueueStore((state) => state.ownerId);
  const allItems = useClaruQueueStore((state) => state.items);
  const isPaused = useClaruQueueStore((state) => state.isPaused);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filesItem, setFilesItem] = useState<ClaruQueueItem | null>(null);
  const [page, setPage] = useState(1);
  const restoreInput = useRef<HTMLInputElement>(null);
  if (ownerId !== user?.id || !can({ anyOf: [PERMISSIONS.CLARU.MANAGE] })) return null;
  const items = allItems.filter((item) => !batchId || item.input.batchId === batchId);
  if (!items.length) return null;
  const totals = items.reduce(
    (sum, item) => {
      const value = progressFor(item);
      return { total: sum.total + value.total, uploaded: sum.uploaded + value.uploaded };
    },
    { total: 0, uploaded: 0 }
  );
  const ready = items.filter((item) => finishedStates.includes(item.status)).length;
  const active = allItems.some((item) => activeStates.includes(item.status));
  const recoverable = allItems.some((item) => ['queued', 'paused'].includes(item.status));
  const failures = items.filter((item) => item.status === 'failed');
  const missing = items.filter((item) => item.status === 'needs_files');
  const pageSize = 20;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(items.length / pageSize)));
  const visible = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const action = (run: () => void) => {
    setError(null);
    setNotice(null);
    try {
      run();
    } catch (failure) {
      setError(getFriendlyErrorMessage(failure));
    }
  };

  const restoreMany = (selected: File[]) => {
    setError(null);
    const signature = (name: string, size: string) => `${name}\u0000${size}`;
    const desiredCounts = new Map<string, number>();
    for (const item of missing)
      for (const part of item.input.parts.filter(
        (part) => !item.uploadedClientPartIds.includes(part.clientPartId)
      )) {
        const key = signature(part.fileName, part.byteSize);
        desiredCounts.set(key, (desiredCounts.get(key) ?? 0) + 1);
      }
    let restored = 0;
    for (const item of missing) {
      const files: Record<string, File> = {};
      const unfinished = item.input.parts.filter(
        (part) => !item.uploadedClientPartIds.includes(part.clientPartId)
      );
      for (const part of unfinished) {
        const key = signature(part.fileName, part.byteSize);
        const matches = selected.filter(
          (file) => file.name === part.fileName && String(file.size) === part.byteSize
        );
        const matched = matches[0];
        if (matched && matches.length === 1 && desiredCounts.get(key) === 1)
          files[part.clientPartId] = matched;
      }
      if (Object.keys(files).length === unfinished.length) {
        try {
          attachClaruQueueFiles(item.id, files);
          restored += 1;
        } catch (failure) {
          setError(getFriendlyErrorMessage(failure));
        }
      }
    }
    setNotice(
      `${restored} ${restored === 1 ? 'clip restored' : 'clips restored'}. ${missing.length - restored} still need their original files. Use each clip's Reselect files button if filenames and sizes are shared.`
    );
  };

  return (
    <Card
      role="region"
      aria-label={batchId ? 'Batch upload queue' : 'Upload queue'}
      className="min-w-0 border-[var(--status-info-border)] shadow-none"
    >
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CloudUpload className="size-4" aria-hidden="true" />
              Upload queue
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {ready} of {items.length} clips uploaded · {formatBytes(totals.uploaded)} /{' '}
              {formatBytes(totals.total)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active || (!isPaused && recoverable) ? (
              <Button size="sm" variant="outline" onClick={() => action(pauseClaruQueue)}>
                <Pause aria-hidden="true" />
                Pause queue
              </Button>
            ) : (
              <Button size="sm" disabled={!recoverable} onClick={() => action(startClaruQueue)}>
                <Play aria-hidden="true" />
                {isPaused && items.some((item) => item.status === 'paused')
                  ? 'Resume queue'
                  : 'Start queue'}
              </Button>
            )}
            {failures.length ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  action(() => failures.forEach((item) => retryClaruQueueItem(item.id)))
                }
              >
                <RotateCcw aria-hidden="true" />
                Retry failed
              </Button>
            ) : null}
            {ready ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  action(() =>
                    items
                      .filter((item) => finishedStates.includes(item.status))
                      .forEach((item) => removeClaruQueueItem(item.id))
                  )
                }
              >
                Clear uploaded
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Clips upload one at a time. You can navigate within the admin panel; keep this browser tab
          open. Uploaded clips still need an authorized admin to seal them.
        </p>
        {missing.length ? (
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs">
              {missing.length} clips need their original files after a browser refresh. Select
              multiple files to restore them together.
            </p>
            <Button size="sm" variant="outline" onClick={() => restoreInput.current?.click()}>
              Reselect queue files
            </Button>
            <input
              ref={restoreInput}
              type="file"
              multiple
              className="sr-only"
              aria-label="Reselect queue files"
              onChange={(event) => {
                restoreMany(Array.from(event.target.files ?? []));
                event.target.value = '';
              }}
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-[var(--status-error)]">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-xs text-[var(--text-secondary)]">
            {notice}
          </p>
        ) : null}
        <div className="space-y-2">
          {visible.map((item) => {
            const value = progressFor(item);
            const status = labels[item.status];
            return (
              <div
                key={item.id}
                data-queue-item={item.id}
                data-claru-queue-row={item.id}
                className="rounded-lg border p-3"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all text-sm font-medium">{item.input.externalRef}</p>
                      <StatusBadge status={status.text} semanticType={status.semantic} />
                    </div>
                    <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
                      {item.input.parts.find((part) => part.fileType === 'video')?.fileName}
                      {!batchId && item.batchName ? ` · ${item.batchName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {['queued', 'creating', 'uploading'].includes(item.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => action(() => pauseClaruQueueItem(item.id))}
                        aria-label={`Pause ${item.input.externalRef}`}
                      >
                        <Pause aria-hidden="true" />
                        Pause
                      </Button>
                    ) : null}
                    {item.status === 'paused' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => action(() => resumeClaruQueueItem(item.id))}
                        aria-label={`Resume ${item.input.externalRef}`}
                      >
                        <Play aria-hidden="true" />
                        Resume
                      </Button>
                    ) : null}
                    {item.status === 'failed' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => action(() => retryClaruQueueItem(item.id))}
                        aria-label={`Retry ${item.input.externalRef}`}
                      >
                        <RotateCcw aria-hidden="true" />
                        Retry
                      </Button>
                    ) : null}
                    {item.status === 'needs_files' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFilesItem(item);
                          setError(null);
                        }}
                        aria-label={`Reselect files for ${item.input.externalRef}`}
                      >
                        Reselect files
                      </Button>
                    ) : null}
                    {item.submissionId ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          href={`/dashboard/claru/submissions/${item.submissionId}`}
                          onClick={onNavigate}
                        >
                          Open clip
                        </Link>
                      </Button>
                    ) : null}
                    {!activeStates.includes(item.status) ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => action(() => removeClaruQueueItem(item.id))}
                        aria-label={`Remove ${item.input.externalRef} from queue`}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {activeStates.includes(item.status) ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                  ) : finishedStates.includes(item.status) ? (
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-[var(--status-success)]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>
                    {formatBytes(value.uploaded)} / {formatBytes(value.total)}
                  </span>
                  <span className="ml-auto">{value.percent}%</span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]"
                  role="progressbar"
                  aria-label={`Upload progress for ${item.input.externalRef}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={value.percent}
                >
                  <div
                    className="h-full rounded-full bg-[var(--action-primary)] transition-[width]"
                    style={{ width: `${value.percent}%` }}
                  />
                </div>
                {item.error ? (
                  <p role="alert" className="mt-2 break-words text-xs text-[var(--status-error)]">
                    {item.error}
                  </p>
                ) : null}
                {item.status === 'ready' ? (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Files are stored and confirmed. Open the clip to review and seal it.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        {items.length > pageSize ? (
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, items.length)} of {items.length}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage * pageSize >= items.length}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
        <p className="text-xs text-[var(--text-muted)]">
          Removing a queue entry only removes it from this browser. Any created submission remains
          in its delivery batch.
        </p>
      </CardContent>
      <QueueFilesDialog
        key={filesItem?.id ?? 'none'}
        item={filesItem}
        onClose={() => setFilesItem(null)}
      />
    </Card>
  );
}

export function ClaruQueueButton() {
  const { user, can } = useAuthorization();
  const ownerId = useClaruQueueStore((state) => state.ownerId);
  const items = useClaruQueueStore((state) => state.items);
  const [open, setOpen] = useState(false);
  if (ownerId !== user?.id || !items.length || !can({ anyOf: [PERMISSIONS.CLARU.MANAGE] }))
    return null;
  const waiting = items.filter((item) => !finishedStates.includes(item.status)).length;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 px-2 sm:px-3"
        onClick={() => setOpen(true)}
        aria-label={`Upload queue, ${waiting} unfinished clips`}
      >
        <CloudUpload className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Upload queue</span>
        <span>{waiting}</span>
      </Button>
      <SheetContent className="w-full overflow-y-auto bg-[var(--bg-base)] p-4 pt-14 sm:max-w-2xl sm:p-6 sm:pt-14">
        <SheetTitle>Claru upload queue</SheetTitle>
        <SheetDescription className="mb-5 mt-1">
          Manage uploads across your delivery batches.
        </SheetDescription>
        <ClaruQueuePanel onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
