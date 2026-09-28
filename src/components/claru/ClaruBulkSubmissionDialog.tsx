'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Files, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { enqueueClaruClips } from '@/services/claru-queue.service';
import type { ClaruBatch, ClaruConsent, ClaruFileType, ClaruProject } from '@/types';
import { ClaruCategoryPicker } from './ClaruCategoryPicker';
import { claruFileTypeLabel, formatBytes, formatClaruDuration } from './claruAdminUtils';
import { claruAcceptByType, claruConsentLabels, claruFileError } from './claruFormUtils';
import {
  buildClaruBulkEntry,
  claruBulkCaptureDefaults,
  claruBulkCaptureFields,
  claruBulkFileFingerprint,
  claruBulkReference,
  countClaruBulkDuplicates,
  readClaruVideoDuration,
  validateClaruBulkRow,
  type ClaruBulkCapture,
  type ClaruBulkRow,
} from './claruBulkFormUtils';

const ROWS_PER_PAGE = 20;
type ConsentKey = keyof ClaruConsent;
const emptyConsent = (): Record<ConsentKey, boolean> => ({
  worker_consent_obtained: false,
  site_or_employer_permission_obtained: false,
  required_consent_or_notice_process_followed: false,
  footage_unedited: false,
});

interface MetadataJob {
  id: string;
  file: File;
  generation: number;
}

export function ClaruBulkSubmissionDialog({
  batch,
  project,
}: {
  batch: ClaruBatch;
  project: ClaruProject;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ClaruBulkRow[]>([]);
  const [capture, setCapture] = useState<ClaruBulkCapture>(() => claruBulkCaptureDefaults(batch));
  const [referencePrefix, setReferencePrefix] = useState(batch.batchRef ?? '');
  const [categoryCode, setCategoryCode] = useState('');
  const [recordedAt, setRecordedAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [consent, setConsent] = useState(emptyConsent);
  const [page, setPage] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const metadata = useRef({
    pending: [] as MetadataJob[],
    active: 0,
    generation: 0,
    controllers: new Set<AbortController>(),
  });

  useEffect(() => {
    const scheduler = metadata.current;
    return () => {
      scheduler.generation += 1;
      scheduler.pending = [];
      for (const controller of scheduler.controllers) controller.abort();
    };
  }, []);

  const duplicates = useMemo(() => countClaruBulkDuplicates(rows), [rows]);
  const rowErrors = useMemo(
    () =>
      new Map(rows.map((row) => [row.id, validateClaruBulkRow(row, rows, project, duplicates)])),
    [rows, project, duplicates]
  );
  const invalidRows = rows.filter((row) => (rowErrors.get(row.id)?.length ?? 0) > 0);
  const totalBytes = rows.reduce(
    (sum, row) =>
      sum +
      row.video.size +
      Object.values(row.relatedFiles)
        .flat()
        .reduce((size, file) => size + file.size, 0),
    0
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  const relatedRoles = project.expectedFiles.filter(
    (expectation) => expectation.fileType !== 'video'
  );

  function drainMetadata() {
    const scheduler = metadata.current;
    while (scheduler.active < 2 && scheduler.pending.length) {
      const job = scheduler.pending.shift()!;
      if (job.generation !== scheduler.generation) continue;
      const controller = new AbortController();
      scheduler.controllers.add(controller);
      scheduler.active += 1;
      void readClaruVideoDuration(job.file, controller.signal)
        .then((seconds) => {
          if (controller.signal.aborted || job.generation !== scheduler.generation) return;
          setRows((current) =>
            current.map((row) => {
              if (row.id !== job.id) return row;
              if (!row.durationMinutes && seconds !== null) {
                return { ...row, durationMinutes: String(seconds / 60), durationSource: 'video' };
              }
              return { ...row, durationSource: 'manual' };
            })
          );
        })
        .catch(() => {
          if (job.generation !== scheduler.generation) return;
          setRows((current) =>
            current.map((row) => (row.id === job.id ? { ...row, durationSource: 'manual' } : row))
          );
        })
        .finally(() => {
          scheduler.controllers.delete(controller);
          scheduler.active -= 1;
          drainMetadata();
        });
    }
  }

  const reset = () => {
    const scheduler = metadata.current;
    scheduler.generation += 1;
    scheduler.pending = [];
    for (const controller of scheduler.controllers) controller.abort();
    setRows([]);
    setCapture(claruBulkCaptureDefaults(batch));
    setReferencePrefix(batch.batchRef ?? '');
    setCategoryCode('');
    setRecordedAt('');
    setDurationMinutes('');
    setConsent(emptyConsent());
    setPage(0);
    setShowErrors(false);
    setError(null);
    setNotice(null);
  };

  const changeOpen = (next: boolean) => {
    if (adding) return;
    setOpen(next);
    if (!next) reset();
  };

  const updateRow = (id: string, updates: Partial<ClaruBulkRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...updates } : row)));
    setError(null);
    setNotice(null);
  };

  const selectVideos = (selected: FileList | null) => {
    if (!selected?.length) return;
    const files = Array.from(selected);
    const problem = files.map((file) => claruFileError(file, 'video')).find(Boolean);
    if (problem) {
      setError(problem);
      return;
    }
    const additions: ClaruBulkRow[] = files.map((video, index) => ({
      id: crypto.randomUUID(),
      video,
      externalRef: claruBulkReference(referencePrefix, video.name, rows.length + index + 1),
      categoryCode,
      recordedAt,
      durationMinutes,
      durationSource: durationMinutes ? 'manual' : 'reading',
      ...capture,
      relatedFiles: {},
      axisConvention: 'RDF',
      videoStartUs: '',
      matchingFileConfirmed: false,
    }));
    setRows((current) => [...current, ...additions]);
    setConsent(emptyConsent());
    setError(null);
    setNotice(null);
    setPage(Math.floor(rows.length / ROWS_PER_PAGE));
    for (const row of additions) {
      if (!row.durationMinutes)
        metadata.current.pending.push({
          id: row.id,
          file: row.video,
          generation: metadata.current.generation,
        });
    }
    drainMetadata();
  };

  const applyShared = () => {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        ...capture,
        ...(categoryCode ? { categoryCode } : {}),
        ...(recordedAt ? { recordedAt } : {}),
        ...(durationMinutes ? { durationMinutes, durationSource: 'manual' as const } : {}),
      }))
    );
    setError(null);
    setNotice('Shared details applied. Review each clip and adjust any exceptions below.');
  };

  const selectRelatedFiles = (
    row: ClaruBulkRow,
    fileType: ClaruFileType,
    selected: FileList | null
  ) => {
    updateRow(row.id, {
      relatedFiles: { ...row.relatedFiles, [fileType]: selected ? Array.from(selected) : [] },
    });
    setConsent(emptyConsent());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (!rows.length) return setError('Select at least one MP4 video to add to the queue.');
    const firstInvalid = invalidRows[0];
    if (firstInvalid) {
      const first = rows.findIndex((row) => row.id === firstInvalid.id);
      setPage(Math.floor(first / ROWS_PER_PAGE));
      setError(
        `Review ${invalidRows.length} ${invalidRows.length === 1 ? 'clip' : 'clips'} with incomplete or conflicting details.`
      );
      window.requestAnimationFrame(() => {
        const card = document.getElementById(`claru-bulk-card-${firstInvalid.id}`);
        card?.focus({ preventScroll: true });
        card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }
    if (!Object.values(consent).every(Boolean)) {
      return setError('Confirm all four consent and footage declarations for every selected clip.');
    }
    setAdding(true);
    try {
      enqueueClaruClips(rows.map((row) => buildClaruBulkEntry(row, batch, project)));
      setOpen(false);
      reset();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The clips could not be added. Review the queue and try again.'
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Files aria-hidden="true" />
        Bulk upload
      </Button>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Bulk upload clips to {batch.name}</DialogTitle>
          <DialogDescription>
            Select multiple videos, review each clip, then add them to the upload queue. Each video
            becomes a separate submission. Sealing remains a separate step.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={submit} noValidate>
          <section className="space-y-4" aria-labelledby="claru-bulk-select-heading">
            <div
              className="rounded-lg border bg-[var(--bg-muted)] p-4"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <h2 id="claru-bulk-select-heading" className="text-sm font-semibold">
                Choose clips
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                This project checks actual videos at seal:{' '}
                {formatClaruDuration(project.clipLength.minSeconds)}–
                {formatClaruDuration(project.clipLength.maxSeconds)}, {project.captureAspectRatio}{' '}
                aspect ratio.
              </p>
              <Label htmlFor="claru-bulk-videos" className="mt-4 block">
                Select MP4 videos
              </Label>
              <input
                id="claru-bulk-videos"
                type="file"
                multiple
                accept={claruAcceptByType.video}
                className="mt-2 block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border file:border-[var(--border-default)] file:bg-[var(--bg-base)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-primary)]"
                onChange={(event) => {
                  selectVideos(event.target.files);
                  event.target.value = '';
                }}
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                You can select more files again to extend this selection. Related files are attached
                to their clip below.
              </p>
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="claru-bulk-defaults-heading">
            <div>
              <h2 id="claru-bulk-defaults-heading" className="text-sm font-semibold">
                Shared capture details
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Newly selected clips inherit these details. Apply changes to existing clips
                explicitly, then review individual exceptions.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {claruBulkCaptureFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`claru-bulk-shared-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`claru-bulk-shared-${field.key}`}
                    maxLength={field.maxLength}
                    value={capture[field.key]}
                    onChange={(event) =>
                      setCapture((current) => ({
                        ...current,
                        [field.key]:
                          field.key === 'country'
                            ? event.target.value.toUpperCase()
                            : event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              {project.categories.length ? (
                <div className="space-y-2">
                  <Label htmlFor="claru-bulk-shared-category">Category for selected clips</Label>
                  <ClaruCategoryPicker
                    id="claru-bulk-shared-category"
                    categories={project.categories}
                    value={categoryCode}
                    onChange={setCategoryCode}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="claru-bulk-shared-recorded">
                  Recorded at for selected clips (local time)
                </Label>
                <Input
                  id="claru-bulk-shared-recorded"
                  type="datetime-local"
                  step="1"
                  value={recordedAt}
                  onChange={(event) => setRecordedAt(event.target.value)}
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Enter the actual capture time. Update each clip if its recording started at a
                  different time.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-bulk-shared-duration">
                  Duration for selected clips (minutes)
                </Label>
                <Input
                  id="claru-bulk-shared-duration"
                  type="number"
                  min={0}
                  max={1440}
                  step="any"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  placeholder="Optional; read from each video"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Leave blank to keep each video&apos;s measured duration.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-bulk-reference-prefix">Reference prefix</Label>
                <Input
                  id="claru-bulk-reference-prefix"
                  value={referencePrefix}
                  maxLength={100}
                  onChange={(event) => setReferencePrefix(event.target.value)}
                  placeholder="e.g. CLR-D3-CARD01"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  References use the prefix, filename and clip number. Review them against your
                  capture manifest.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={!rows.length} onClick={applyShared}>
                Apply shared details to all clips
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!rows.length}
                onClick={() => {
                  setRows((current) =>
                    current.map((row, index) => ({
                      ...row,
                      externalRef: claruBulkReference(referencePrefix, row.video.name, index + 1),
                    }))
                  );
                  setNotice(
                    'References regenerated from the prefix and filenames. Review them against your capture manifest.'
                  );
                  setError(null);
                }}
              >
                Regenerate references
              </Button>
            </div>
            {notice ? (
              <p role="status" className="text-sm text-[var(--text-secondary)]">
                {notice}
              </p>
            ) : null}
          </section>

          <section
            className="space-y-4 border-t pt-5"
            style={{ borderColor: 'var(--border-default)' }}
            aria-labelledby="claru-bulk-review-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="claru-bulk-review-heading" className="text-sm font-semibold">
                  Review each clip
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {rows.length
                    ? `${rows.length} clips · ${formatBytes(totalBytes)} total · ${invalidRows.length} need review`
                    : 'Your selected videos will appear here.'}
                </p>
              </div>
              {rows.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRows([]);
                    metadata.current.pending = [];
                    for (const controller of metadata.current.controllers) controller.abort();
                    setConsent(emptyConsent());
                    setPage(0);
                    setError(null);
                  }}
                >
                  Clear selection
                </Button>
              ) : null}
            </div>
            {pageRows.map((row, pageIndex) => {
              const clipNumber = currentPage * ROWS_PER_PAGE + pageIndex + 1;
              const prefix = `claru-bulk-row-${row.id}`;
              const errors = rowErrors.get(row.id) ?? [];
              const matchingFile =
                (duplicates.files.get(claruBulkFileFingerprint(row.video)) ?? 0) > 1;
              return (
                <article
                  key={row.id}
                  id={`claru-bulk-card-${row.id}`}
                  tabIndex={-1}
                  data-claru-bulk-row
                  data-row-id={row.id}
                  className="min-w-0 rounded-lg border p-4"
                  style={{
                    borderColor:
                      showErrors && errors.length
                        ? 'var(--status-error-border)'
                        : 'var(--border-default)',
                  }}
                  aria-label={`Clip ${clipNumber}: ${row.video.name}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-all text-sm font-semibold">
                        {clipNumber}. {row.video.name}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {formatBytes(row.video.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      aria-label={`Remove clip ${clipNumber}`}
                      onClick={() => {
                        setRows((current) => current.filter((entry) => entry.id !== row.id));
                        metadata.current.pending = metadata.current.pending.filter(
                          (job) => job.id !== row.id
                        );
                        setError(null);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-ref`}>Clip {clipNumber} external reference</Label>
                      <Input
                        id={`${prefix}-ref`}
                        value={row.externalRef}
                        maxLength={200}
                        onChange={(event) => updateRow(row.id, { externalRef: event.target.value })}
                      />
                    </div>
                    {project.categories.length ? (
                      <div className="space-y-2">
                        <Label htmlFor={`${prefix}-category`}>Clip {clipNumber} category</Label>
                        <ClaruCategoryPicker
                          id={`${prefix}-category`}
                          categories={project.categories}
                          value={row.categoryCode}
                          onChange={(value) => updateRow(row.id, { categoryCode: value })}
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-recorded`}>
                        Clip {clipNumber} recorded at (local time)
                      </Label>
                      <Input
                        id={`${prefix}-recorded`}
                        type="datetime-local"
                        step="1"
                        value={row.recordedAt}
                        onChange={(event) => updateRow(row.id, { recordedAt: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-duration`}>
                        Clip {clipNumber} duration in minutes
                      </Label>
                      <Input
                        id={`${prefix}-duration`}
                        type="number"
                        min={0}
                        max={1440}
                        step="any"
                        value={row.durationMinutes}
                        onChange={(event) =>
                          updateRow(row.id, {
                            durationMinutes: event.target.value,
                            durationSource: 'manual',
                          })
                        }
                      />
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.durationSource === 'reading'
                          ? 'Reading video metadata… You can enter the duration.'
                          : row.durationSource === 'video'
                            ? 'Read from this video. Review before uploading.'
                            : 'Enter the duration measured for this clip.'}
                      </p>
                    </div>
                  </div>
                  {matchingFile ? (
                    <div
                      className="mt-4 space-y-2 rounded-md border p-3"
                      style={{
                        borderColor: 'var(--status-warning-border)',
                        backgroundColor: 'var(--status-warning-bg)',
                      }}
                    >
                      <p className="text-xs">
                        A video with the same filename, size and modification time is selected more
                        than once. Check for an accidental duplicate.
                      </p>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`${prefix}-matching-confirmation`}
                          checked={row.matchingFileConfirmed}
                          onCheckedChange={(checked) =>
                            updateRow(row.id, { matchingFileConfirmed: checked === true })
                          }
                        />
                        <Label
                          htmlFor={`${prefix}-matching-confirmation`}
                          className="text-xs font-normal leading-5"
                        >
                          Clip {clipNumber} is a separate recording and its reference is correct.
                        </Label>
                      </div>
                    </div>
                  ) : null}
                  <details
                    className="mt-4 border-t pt-3"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <summary className="cursor-pointer text-sm font-medium">
                      Capture details and related files
                    </summary>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {claruBulkCaptureFields.map((field) => (
                        <div className="space-y-2" key={field.key}>
                          <Label htmlFor={`${prefix}-${field.key}`}>
                            Clip {clipNumber} {field.label.toLowerCase()}
                          </Label>
                          <Input
                            id={`${prefix}-${field.key}`}
                            value={row[field.key]}
                            maxLength={field.maxLength}
                            onChange={(event) =>
                              updateRow(row.id, {
                                [field.key]:
                                  field.key === 'country'
                                    ? event.target.value.toUpperCase()
                                    : event.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {relatedRoles.length ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {relatedRoles.map((expectation) => (
                          <div
                            key={expectation.fileType}
                            className="min-w-0 rounded-md border p-3"
                            style={{ borderColor: 'var(--border-default)' }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor={`${prefix}-${expectation.fileType}-files`}>
                                Clip {clipNumber}{' '}
                                {claruFileTypeLabel(expectation.fileType).toLowerCase()}
                              </Label>
                              <span className="text-xs text-[var(--text-muted)]">
                                {expectation.required ? 'Required' : 'Optional'}
                              </span>
                            </div>
                            <input
                              id={`${prefix}-${expectation.fileType}-files`}
                              type="file"
                              accept={claruAcceptByType[expectation.fileType]}
                              multiple={expectation.fileType === 'other'}
                              onChange={(event) =>
                                selectRelatedFiles(row, expectation.fileType, event.target.files)
                              }
                              className="mt-2 block w-full text-xs file:mr-2 file:rounded-md file:border file:border-[var(--border-default)] file:bg-[var(--bg-base)] file:px-2 file:py-2 file:text-xs file:text-[var(--text-primary)]"
                            />
                            {(row.relatedFiles[expectation.fileType]?.length ?? 0) > 0 ? (
                              <div className="mt-2">
                                <p className="break-all text-xs text-[var(--text-muted)]">
                                  {row.relatedFiles[expectation.fileType]
                                    ?.map((file) => `${file.name} (${formatBytes(file.size)})`)
                                    .join(', ')}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1"
                                  onClick={() => {
                                    selectRelatedFiles(row, expectation.fileType, null);
                                    const input = document.getElementById(
                                      `${prefix}-${expectation.fileType}-files`
                                    ) as HTMLInputElement | null;
                                    if (input) input.value = '';
                                  }}
                                >
                                  Clear files
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {(row.relatedFiles.inputs?.length ?? 0) > 0 ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`${prefix}-axis`}>
                            Clip {clipNumber} IMU axis convention
                          </Label>
                          <Input
                            id={`${prefix}-axis`}
                            maxLength={3}
                            value={row.axisConvention}
                            onChange={(event) =>
                              updateRow(row.id, {
                                axisConvention: event.target.value.toUpperCase(),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${prefix}-video-start`}>
                            Clip {clipNumber} video start, microseconds
                          </Label>
                          <Input
                            id={`${prefix}-video-start`}
                            type="number"
                            step="1"
                            value={row.videoStartUs}
                            onChange={(event) =>
                              updateRow(row.id, { videoStartUs: event.target.value })
                            }
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    ) : null}
                  </details>
                  {showErrors && errors.length ? (
                    <ul
                      className="mt-3 list-disc space-y-1 pl-5 text-xs"
                      style={{ color: 'var(--status-error)' }}
                      role="alert"
                    >
                      {errors.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
            {pageCount > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Clips {currentPage * ROWS_PER_PAGE + 1}–
                  {Math.min((currentPage + 1) * ROWS_PER_PAGE, rows.length)} of {rows.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft aria-hidden="true" />
                    Previous clips
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pageCount - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next clips
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section
            className="space-y-3 border-t pt-5"
            style={{ borderColor: 'var(--border-default)' }}
            aria-labelledby="claru-bulk-consent-heading"
          >
            <div>
              <h2 id="claru-bulk-consent-heading" className="text-sm font-semibold">
                Consent for all selected clips
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Confirm each statement is true for every one of the {rows.length} selected clips.
                Remove any clip that does not meet these declarations.
              </p>
            </div>
            {Object.entries(claruConsentLabels).map(([key, label]) => (
              <div className="flex items-start gap-3" key={key}>
                <Checkbox
                  id={`claru-bulk-consent-${key}`}
                  checked={consent[key as ConsentKey]}
                  onCheckedChange={(checked) =>
                    setConsent((current) => ({ ...current, [key]: checked === true }))
                  }
                />
                <Label
                  htmlFor={`claru-bulk-consent-${key}`}
                  className="pt-0.5 text-sm font-normal leading-5"
                >
                  {label}
                </Label>
              </div>
            ))}
          </section>
          {error ? (
            <p
              role="alert"
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--status-error-bg)',
                borderColor: 'var(--status-error-border)',
                color: 'var(--status-error)',
              }}
            >
              {error}
            </p>
          ) : null}
          <DialogFooter className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
            <Button
              type="button"
              variant="outline"
              disabled={adding}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={adding || !rows.length}>
              {adding
                ? 'Adding clips…'
                : `Add ${rows.length} ${rows.length === 1 ? 'clip' : 'clips'} to queue`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
