'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { ClaruCategoryPicker } from './ClaruCategoryPicker';
import {
  claruConsentLabels,
  claruAcceptByType as acceptByType,
  claruFileError,
  validClaruAxis,
} from './claruFormUtils';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateClaruSubmission } from '@/hooks/api/useClaru';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { useClaruUploadStore } from '@/store/claru-upload.store';
import type { ClaruDeclaration, ClaruFileType, ClaruProject, ClaruSubmission } from '@/types';
import { claruFileTypeLabel, formatBytes, formatClaruDuration } from './claruAdminUtils';

const localDateTimeValue = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 19);
};

const declarationForm = (submission: ClaruSubmission) => ({
  categoryCode: submission.declared.categoryCode ?? '',
  country: submission.declared.country,
  collectorId: submission.declared.collectorId,
  siteId: submission.declared.siteId,
  device: submission.declared.device,
  mount: submission.declared.mount,
  recordedAt: localDateTimeValue(submission.declared.recordedAt),
  durationMinutes: String(submission.declared.durationSeconds / 60),
  axisConvention: submission.declared.imu?.axisConvention ?? 'RDF',
  videoStartUs:
    submission.declared.imu?.videoStartUs == null
      ? ''
      : String(submission.declared.imu.videoStartUs),
});

interface ClaruResumeUploadDialogProps {
  submission: ClaruSubmission;
  project?: ClaruProject;
}

export function ClaruResumeUploadDialog({ submission, project }: ClaruResumeUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [correctionMode, setCorrectionMode] = useState<'files' | 'declaration'>('files');
  const [form, setForm] = useState(() => declarationForm(submission));
  const [filesByPartId, setFilesByPartId] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState<Record<string, boolean>>({});
  const [removedParts, setRemovedParts] = useState<string[]>([]);
  const [addedFiles, setAddedFiles] = useState<Partial<Record<ClaruFileType, File[]>>>({});
  const mutation = useCreateClaruSubmission();
  const stageUpload = useClaruUploadStore((state) => state.stageUpload);
  const pendingParts = submission.parts.filter((part) => part.uploadState === 'pending');
  const isRefused = submission.state === 'refused';
  const isExpired = submission.state === 'expired';
  const isCorrection =
    isRefused || isExpired || Boolean(submission.lastRefusal) || pendingParts.length === 0;
  const replacingFiles = isExpired || (isCorrection && correctionMode === 'files');
  const retainedParts = replacingFiles
    ? submission.parts.filter((part) => !removedParts.includes(part.id))
    : submission.parts;
  const selectableParts = replacingFiles ? retainedParts : pendingParts;
  const extraRoles =
    project?.expectedFiles.filter(
      (role) =>
        role.fileType === 'other' || !retainedParts.some((part) => part.fileType === role.fileType)
    ) ?? [];
  const hasInputs =
    retainedParts.some((part) => part.fileType === 'inputs') ||
    (replacingFiles && Boolean(addedFiles.inputs?.length));

  const reset = () => {
    setConsent({});
    setRemovedParts([]);
    setAddedFiles({});
    setCorrectionMode('files');
    setForm(declarationForm(submission));
    setFilesByPartId({});
    setError(null);
    mutation.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && mutation.isPending) return;
    setOpen(next);
    if (!next) reset();
  };

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const extras = replacingFiles
      ? extraRoles.flatMap((role) =>
          (addedFiles[role.fileType] ?? []).map((file) => ({ fileType: role.fileType, file }))
        )
      : [];
    if (retainedParts.length + extras.length > 20) {
      return setError('A clip can contain at most 20 files.');
    }
    for (const extra of extras) {
      const problem = claruFileError(extra.file, extra.fileType);
      if (problem) return setError(problem);
    }
    const missingRole = project?.expectedFiles.find(
      (role) =>
        role.required &&
        !retainedParts.some((part) => part.fileType === role.fileType) &&
        !extras.some((part) => part.fileType === role.fileType)
    );
    if (missingRole) return setError(`${claruFileTypeLabel(missingRole.fileType)} is required.`);

    const mismatch = selectableParts.find((part) => {
      const file = filesByPartId[part.id];
      return (
        !file ||
        Boolean(claruFileError(file, part.fileType)) ||
        (!replacingFiles && (file.name !== part.fileName || String(file.size) !== part.byteSize))
      );
    });
    if (mismatch) {
      setError(
        isCorrection
          ? `Select a valid replacement for ${claruFileTypeLabel(mismatch.fileType)}. Videos must be non-empty MP4 files and motion-sensor inputs cannot exceed 64 MiB.`
          : `Select ${mismatch.fileName} with the exact declared name and size (${formatBytes(mismatch.byteSize)}).`
      );
      return;
    }

    if (
      !isExpired &&
      replacingFiles &&
      removedParts.length === 0 &&
      extras.length === 0 &&
      selectableParts.every((part) => {
        const file = filesByPartId[part.id];
        return Boolean(file && file.name === part.fileName && String(file.size) === part.byteSize);
      })
    ) {
      setError(
        'Claru treats an identical file declaration as a replay. Rename at least one corrected file or select a file with a different size so fresh upload URLs are created.'
      );
      return;
    }

    if (replacingFiles && !Object.keys(claruConsentLabels).every((key) => consent[key])) {
      setError('Confirm all four consent statements for the replacement footage.');
      return;
    }
    let declared = submission.declared;
    if (isCorrection) {
      const originalForm = declarationForm(submission);
      const normalizedCountry = form.country.trim().toUpperCase();
      const recordedTimestamp = Date.parse(form.recordedAt);
      const durationSeconds = Number(form.durationMinutes) * 60;
      const videoStartUs = form.videoStartUs.trim() ? Number(form.videoStartUs) : null;

      if (project?.categories.length && !form.categoryCode) {
        setError('Choose the corrected activity category.');
        return;
      }
      if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
        setError('Country must use a two-letter ISO code, such as IN.');
        return;
      }
      if (
        !form.collectorId.trim() ||
        !form.siteId.trim() ||
        !form.device.trim() ||
        !form.mount.trim()
      ) {
        setError('Collector, site, device, and mount are required.');
        return;
      }
      if (!Number.isFinite(recordedTimestamp)) {
        setError('Enter a valid recording date and time.');
        return;
      }
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 86_400) {
        setError('Enter a positive duration of no more than 1,440 minutes.');
        return;
      }
      if (hasInputs && !validClaruAxis(form.axisConvention)) {
        setError('Use one direction from each camera axis: R/L, U/D, and F/B, such as RDF.');
        return;
      }
      if (
        form.videoStartUs.trim() &&
        (!Number.isSafeInteger(videoStartUs) || !Number.isFinite(videoStartUs))
      ) {
        setError('Video start must be an exact whole number of microseconds.');
        return;
      }

      declared = {
        ...submission.declared,
        ...(form.categoryCode ? { categoryCode: form.categoryCode } : {}),
        country: normalizedCountry,
        collectorId: form.collectorId.trim(),
        siteId: form.siteId.trim(),
        device: form.device.trim(),
        mount: form.mount.trim(),
        recordedAt:
          form.recordedAt === originalForm.recordedAt
            ? submission.declared.recordedAt
            : new Date(recordedTimestamp).toISOString(),
        durationSeconds:
          form.durationMinutes === originalForm.durationMinutes
            ? submission.declared.durationSeconds
            : durationSeconds,
        ...(hasInputs
          ? {
              imu:
                form.axisConvention === originalForm.axisConvention &&
                form.videoStartUs === originalForm.videoStartUs &&
                submission.declared.imu
                  ? submission.declared.imu
                  : {
                      axisConvention: form.axisConvention.trim().toUpperCase(),
                      videoStartUs,
                    },
            }
          : {}),
      } satisfies ClaruDeclaration;

      if (
        isRefused &&
        !replacingFiles &&
        JSON.stringify(declared) === JSON.stringify(submission.declared)
      ) {
        setError('Change at least one declaration field before saving the correction.');
        return;
      }
    }

    if (!hasInputs) {
      declared = { ...declared };
      delete declared.imu;
    }
    const newParts = extras.map(({ fileType, file }) => ({
      clientPartId: crypto.randomUUID(),
      fileType,
      fileName: file.name,
      byteSize: String(file.size),
      file,
    }));
    const filesByClientPartId = Object.fromEntries(
      selectableParts.map((part) => [part.clientPartId, filesByPartId[part.id]!])
    );
    newParts.forEach((part) => {
      filesByClientPartId[part.clientPartId] = part.file;
    });
    mutation.mutate(
      {
        batchId: submission.batchId,
        externalRef: submission.externalRef,
        declared,
        parts: [
          ...retainedParts.map((part) => {
            const replacement = replacingFiles ? filesByPartId[part.id] : undefined;
            return {
              clientPartId: part.clientPartId,
              fileType: part.fileType,
              fileName: replacement?.name ?? part.fileName,
              byteSize: replacement ? String(replacement.size) : part.byteSize,
            };
          }),
          ...newParts.map(({ clientPartId, fileType, fileName, byteSize }) => ({
            clientPartId,
            fileType,
            fileName,
            byteSize,
          })),
        ],
      },
      {
        onSuccess: (result) => {
          const requiresTransfer = result.uploadInstructions.some(
            (instruction) => instruction.uploadState === 'pending'
          );
          if (requiresTransfer && Object.keys(filesByClientPartId).length > 0) {
            stageUpload(result, filesByClientPartId);
          } else if (requiresTransfer) {
            toast.info('Declaration saved. Reselect the unfinished files to continue.');
          } else if (replacingFiles) {
            setError(
              'Claru did not return fresh upload instructions. Change a corrected file name or byte size and try again.'
            );
            return;
          } else {
            toast.success('Claru declaration updated; the stored files remain complete');
          }
          setOpen(false);
          reset();
        },
      }
    );
  };

  const triggerLabel =
    isCorrection && !isExpired
      ? 'Correct submission'
      : isExpired
        ? 'Restart delivery'
        : 'Resume upload';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        disabled={!isCorrection && selectableParts.length === 0}
      >
        {triggerLabel}
      </Button>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isCorrection ? 'Correct this Claru submission' : 'Resume clip upload'}
          </DialogTitle>
          <DialogDescription>
            {isCorrection
              ? 'Keep the same external reference, correct the declaration or delivery files, and send the submission through validation again.'
              : 'Reselect each unfinished local file. Claru will return fresh signed URLs while preserving completed files and multipart checkpoints.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          {isCorrection && !isExpired ? (
            <RadioGroup
              className="grid gap-3 sm:grid-cols-2"
              value={correctionMode}
              onValueChange={(value) => {
                setCorrectionMode(value as 'files' | 'declaration');
                setFilesByPartId({});
                setError(null);
              }}
            >
              <Label
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                htmlFor="claru-correction-files"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <RadioGroupItem id="claru-correction-files" value="files" className="mt-0.5" />
                <span>
                  <span className="block font-medium">Replace delivery files</span>
                  <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">
                    Reselect every role and upload corrected media.
                  </span>
                </span>
              </Label>
              <Label
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                htmlFor="claru-correction-declaration"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <RadioGroupItem
                  id="claru-correction-declaration"
                  value="declaration"
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-medium">Declaration only</span>
                  <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">
                    Keep the stored files and correct capture details.
                  </span>
                </span>
              </Label>
            </RadioGroup>
          ) : null}

          {isCorrection ? (
            <section className="space-y-4" aria-labelledby="claru-correction-declaration-heading">
              <div>
                <h2 id="claru-correction-declaration-heading" className="text-sm font-semibold">
                  Capture declaration
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Review these values even when the refusal names a media check.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project && project.categories.length > 0 ? (
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="claru-correction-category">Category</Label>
                    <ClaruCategoryPicker
                      id="claru-correction-category"
                      categories={project.categories}
                      value={form.categoryCode}
                      onChange={(value) => update('categoryCode', value)}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="claru-correction-recorded">Recorded at (local time)</Label>
                  <Input
                    id="claru-correction-recorded"
                    type="datetime-local"
                    step="1"
                    value={form.recordedAt}
                    onChange={(event) => update('recordedAt', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claru-correction-duration">Duration in minutes</Label>
                  <Input
                    id="claru-correction-duration"
                    type="number"
                    min={0}
                    max={1440}
                    step="any"
                    aria-describedby="claru-correction-duration-help"
                    value={form.durationMinutes}
                    onChange={(event) => update('durationMinutes', event.target.value)}
                  />
                  <p
                    id="claru-correction-duration-help"
                    className="text-xs text-[var(--text-muted)]"
                  >
                    Declare the duration you measured. Claru checks the actual file
                    {project
                      ? ` against this project's ${formatClaruDuration(project.clipLength.minSeconds)}–${formatClaruDuration(project.clipLength.maxSeconds)} range`
                      : ' against the project length range'}
                    {' at seal.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claru-correction-country">Country</Label>
                  <Input
                    id="claru-correction-country"
                    maxLength={2}
                    value={form.country}
                    onChange={(event) => update('country', event.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claru-correction-collector">Collector ID</Label>
                  <Input
                    id="claru-correction-collector"
                    maxLength={200}
                    value={form.collectorId}
                    onChange={(event) => update('collectorId', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claru-correction-site">Site ID</Label>
                  <Input
                    id="claru-correction-site"
                    maxLength={200}
                    value={form.siteId}
                    onChange={(event) => update('siteId', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claru-correction-device">Device</Label>
                  <Input
                    id="claru-correction-device"
                    maxLength={300}
                    value={form.device}
                    onChange={(event) => update('device', event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="claru-correction-mount">Mount</Label>
                  <Input
                    id="claru-correction-mount"
                    maxLength={200}
                    value={form.mount}
                    onChange={(event) => update('mount', event.target.value)}
                  />
                </div>
                {hasInputs ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="claru-correction-axis">IMU axis convention</Label>
                      <Input
                        id="claru-correction-axis"
                        maxLength={3}
                        value={form.axisConvention}
                        onChange={(event) =>
                          update('axisConvention', event.target.value.toUpperCase())
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claru-correction-video-start">
                        Video start, microseconds
                      </Label>
                      <Input
                        id="claru-correction-video-start"
                        type="number"
                        step="1"
                        value={form.videoStartUs}
                        onChange={(event) => update('videoStartUs', event.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          {selectableParts.length > 0 ? (
            <section
              className={isCorrection ? 'space-y-4 border-t pt-5' : 'space-y-4'}
              style={isCorrection ? { borderColor: 'var(--border-default)' } : undefined}
              aria-labelledby="claru-correction-files-heading"
            >
              <div>
                <h2 id="claru-correction-files-heading" className="text-sm font-semibold">
                  {isCorrection ? 'Delivery files' : 'Unfinished files'}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {replacingFiles
                    ? isExpired
                      ? 'Reselect every file to restart this expired delivery.'
                      : 'Reselect every role. Give corrected media a new filename so it can replace the stored version.'
                    : 'The selected file name and byte size must match the original declaration.'}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {selectableParts.map((part) => (
                  <div
                    className="rounded-lg border p-4"
                    style={{ borderColor: 'var(--border-default)' }}
                    key={part.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Label htmlFor={`claru-resume-${part.id}`}>
                          {claruFileTypeLabel(part.fileType)}
                        </Label>
                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {isCorrection ? `Previous: ${part.fileName}` : part.fileName}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--text-muted)]">
                        {formatBytes(part.byteSize)}
                      </span>
                    </div>
                    <input
                      id={`claru-resume-${part.id}`}
                      type="file"
                      accept={acceptByType[part.fileType]}
                      required
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setFilesByPartId((current) => ({ ...current, [part.id]: file }));
                          setError(null);
                        }
                      }}
                      className="mt-3 block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border file:border-[var(--border-default)] file:bg-[var(--bg-base)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-primary)]"
                    />
                    {replacingFiles &&
                    project?.expectedFiles.some(
                      (role) => role.fileType === part.fileType && !role.required
                    ) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setRemovedParts((current) => [...current, part.id]);
                          setError(null);
                        }}
                      >
                        Remove {claruFileTypeLabel(part.fileType).toLowerCase()}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {replacingFiles && extraRoles.length > 0 ? (
            <section className="space-y-3" aria-label="Additional delivery files">
              <p className="text-sm font-semibold">Add missing files or sidecars</p>
              <p className="text-xs text-[var(--text-muted)]">
                Use these when a check asks for another file, such as sensor data or frame
                timestamps.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {extraRoles.map((role) => (
                  <div
                    key={role.fileType}
                    className="rounded-lg border border-[var(--border-default)] p-4"
                  >
                    <Label htmlFor={`claru-extra-${role.fileType}`}>
                      {claruFileTypeLabel(role.fileType)}
                      {role.required ? ' (required)' : ' (optional)'}
                    </Label>
                    <input
                      id={`claru-extra-${role.fileType}`}
                      type="file"
                      accept={acceptByType[role.fileType]}
                      multiple={role.fileType === 'other'}
                      required={role.required}
                      onChange={(event) => {
                        const selected = Array.from(event.target.files ?? []);
                        setAddedFiles((current) => ({ ...current, [role.fileType]: selected }));
                        setError(null);
                      }}
                      className="mt-3 block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border file:border-[var(--border-default)] file:bg-[var(--bg-base)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-primary)]"
                    />
                    {addedFiles[role.fileType]?.length ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setAddedFiles((current) => ({ ...current, [role.fileType]: [] }));
                          const input = document.getElementById(
                            `claru-extra-${role.fileType}`
                          ) as HTMLInputElement | null;
                          if (input) input.value = '';
                        }}
                      >
                        Clear selection
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {replacingFiles ? (
            <section
              className="space-y-3 border-t border-[var(--border-default)] pt-4"
              aria-label="Replacement footage consent"
            >
              <h2 className="text-sm font-semibold">Confirm consent for replacement footage</h2>
              {Object.entries(claruConsentLabels).map(([key, label]) => (
                <div className="flex items-start gap-3" key={key}>
                  <Checkbox
                    id={`claru-replacement-${key}`}
                    checked={consent[key] === true}
                    onCheckedChange={(checked) =>
                      setConsent((current) => ({ ...current, [key]: checked === true }))
                    }
                  />
                  <Label
                    htmlFor={`claru-replacement-${key}`}
                    className="text-sm font-normal leading-5"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </section>
          ) : null}

          {error || mutation.isError ? (
            <p
              className="rounded-md border px-3 py-2 text-sm"
              role="alert"
              style={{
                backgroundColor: 'var(--status-error-bg)',
                borderColor: 'var(--status-error-border)',
                color: 'var(--status-error)',
              }}
            >
              {error ??
                `${getFriendlyErrorMessage(mutation.error)} Retry using this same clip reference.`}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Preparing…'
                : isCorrection
                  ? replacingFiles
                    ? 'Prepare corrected upload'
                    : 'Save declaration'
                  : 'Prepare upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
