'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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
import { ClaruCategoryPicker } from './ClaruCategoryPicker';
import {
  claruConsentLabels as consentLabels,
  claruAcceptByType as acceptByType,
  claruFileError,
  validClaruAxis,
} from './claruFormUtils';
import { useCreateClaruSubmission } from '@/hooks/api/useClaru';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { useClaruUploadStore } from '@/store/claru-upload.store';
import type { ClaruBatch, ClaruConsent, ClaruFileType, ClaruProject } from '@/types';
import { claruFileTypeLabel, formatClaruDuration, formatBytes } from './claruAdminUtils';

interface ClaruCreateSubmissionDialogProps {
  batch: ClaruBatch;
  project: ClaruProject;
}

type ConsentKey = keyof ClaruConsent;

const emptyFiles = (): Record<ClaruFileType, File[]> => ({
  video: [],
  inputs: [],
  frames: [],
  video_right: [],
  calibration: [],
  other: [],
});

const localDateTimeValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export function ClaruCreateSubmissionDialog({ batch, project }: ClaruCreateSubmissionDialogProps) {
  const router = useRouter();
  const mutation = useCreateClaruSubmission();
  const stageUpload = useClaruUploadStore((state) => state.stageUpload);
  const [open, setOpen] = useState(false);
  const [externalRef, setExternalRef] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [country, setCountry] = useState(batch.defaults?.country ?? 'IN');
  const [collectorId, setCollectorId] = useState(batch.defaults?.collectorId ?? '');
  const [siteId, setSiteId] = useState(batch.defaults?.siteId ?? '');
  const [device, setDevice] = useState(batch.defaults?.device ?? '');
  const [mount, setMount] = useState(batch.defaults?.mount ?? '');
  const [recordedAt, setRecordedAt] = useState(localDateTimeValue);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [axisConvention, setAxisConvention] = useState('RDF');
  const [videoStartUs, setVideoStartUs] = useState('');
  const [files, setFiles] = useState(emptyFiles);
  const [consent, setConsent] = useState<Record<ConsentKey, boolean>>({
    worker_consent_obtained: false,
    site_or_employer_permission_obtained: false,
    required_consent_or_notice_process_followed: false,
    footage_unedited: false,
  });
  const [error, setError] = useState<string | null>(null);

  const expectedFiles = project.expectedFiles;
  const hasInputs = files.inputs.length > 0;
  const categoryOptions = project.categories;

  const reset = () => {
    setExternalRef('');
    setCategoryCode('');
    setCountry(batch.defaults?.country ?? 'IN');
    setCollectorId(batch.defaults?.collectorId ?? '');
    setSiteId(batch.defaults?.siteId ?? '');
    setDevice(batch.defaults?.device ?? '');
    setMount(batch.defaults?.mount ?? '');
    setRecordedAt(localDateTimeValue());
    setDurationMinutes('');
    setAxisConvention('RDF');
    setVideoStartUs('');
    setFiles(emptyFiles());
    setConsent({
      worker_consent_obtained: false,
      site_or_employer_permission_obtained: false,
      required_consent_or_notice_process_followed: false,
      footage_unedited: false,
    });
    setError(null);
    mutation.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && mutation.isPending) return;
    setOpen(next);
    if (!next) reset();
  };

  const setRoleFiles = (fileType: ClaruFileType, selected: FileList | null) => {
    const nextFiles = selected ? Array.from(selected) : [];
    setFiles((current) => ({ ...current, [fileType]: nextFiles }));
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const durationSeconds = Number(durationMinutes) * 60;
    const normalizedCountry = country.trim().toUpperCase();
    const recordedTimestamp = Date.parse(recordedAt);
    const selectedFiles = Object.values(files).flat();
    const missingRole = expectedFiles.find(
      (expectation) => expectation.required && files[expectation.fileType].length === 0
    );

    if (!externalRef.trim() || /[\u0000-\u001f\u007f]/.test(externalRef))
      return setError('Enter a unique clip reference without control characters.');
    if (categoryOptions.length > 0 && !categoryCode) return setError('Choose a clip category.');
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      return setError('Country must use a two-letter ISO code, such as IN.');
    }
    if (!collectorId.trim() || !siteId.trim() || !device.trim() || !mount.trim()) {
      return setError('Collector, site, device, and mount are required.');
    }
    if (!Number.isFinite(recordedTimestamp))
      return setError('Enter a valid recording date and time.');
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 86_400) {
      return setError('Enter a positive duration of no more than 1,440 minutes.');
    }
    if (missingRole) {
      return setError(`${claruFileTypeLabel(missingRole.fileType)} is required for this project.`);
    }
    if (selectedFiles.length === 0) return setError('Choose the files to upload.');
    if (selectedFiles.length > 20) return setError('A clip can contain at most 20 files.');
    for (const role of expectedFiles) {
      for (const file of files[role.fileType]) {
        const problem = claruFileError(file, role.fileType);
        if (problem) return setError(problem);
      }
    }
    if (!Object.values(consent).every(Boolean)) {
      return setError('Confirm all four consent and footage declarations.');
    }
    if (hasInputs && !validClaruAxis(axisConvention)) {
      return setError('Use one direction from each camera axis: R/L, U/D, and F/B, such as RDF.');
    }
    if (
      videoStartUs.trim() &&
      (!Number.isSafeInteger(Number(videoStartUs)) || !Number.isFinite(Number(videoStartUs)))
    ) {
      return setError('Video start must be an exact whole number of microseconds.');
    }

    const filesByClientPartId: Record<string, File> = {};
    const parts = expectedFiles.flatMap((expectation) =>
      files[expectation.fileType].map((file) => {
        const clientPartId = crypto.randomUUID();
        filesByClientPartId[clientPartId] = file;
        return {
          clientPartId,
          fileType: expectation.fileType,
          fileName: file.name,
          byteSize: String(file.size),
        };
      })
    );

    mutation.mutate(
      {
        batchId: batch.id,
        externalRef: externalRef.trim(),
        declared: {
          ...(categoryCode ? { categoryCode } : {}),
          country: normalizedCountry,
          collectorId: collectorId.trim(),
          siteId: siteId.trim(),
          device: device.trim(),
          mount: mount.trim(),
          recordedAt: new Date(recordedTimestamp).toISOString(),
          durationSeconds,
          consent: {
            worker_consent_obtained: true,
            site_or_employer_permission_obtained: true,
            required_consent_or_notice_process_followed: true,
            footage_unedited: true,
          },
          ...(hasInputs
            ? {
                imu: {
                  axisConvention: axisConvention.trim().toUpperCase(),
                  videoStartUs: videoStartUs.trim() ? Number(videoStartUs) : null,
                },
              }
            : {}),
        },
        parts,
      },
      {
        onSuccess: (result) => {
          stageUpload(result, filesByClientPartId);
          setOpen(false);
          reset();
          router.push(`/dashboard/claru/submissions/${result.submission.id}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Add clip
      </Button>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add clip to {batch.name}</DialogTitle>
          <DialogDescription>
            Declare the capture and choose its exact files. Upload begins on the next screen.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={submit}>
          <section className="space-y-4" aria-labelledby="claru-identity-heading">
            <div>
              <h2 id="claru-identity-heading" className="text-sm font-semibold">
                Clip identity
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Use a unique reference from your capture manifest. Keep the same reference when
                retrying this clip.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="claru-external-ref">External reference</Label>
                <Input
                  id="claru-external-ref"
                  value={externalRef}
                  maxLength={200}
                  onChange={(event) => setExternalRef(event.target.value)}
                  placeholder="kitchen-2026-09-14-0031"
                  autoFocus
                />
              </div>
              {categoryOptions.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="claru-category">Category</Label>
                  <ClaruCategoryPicker
                    id="claru-category"
                    categories={categoryOptions}
                    value={categoryCode}
                    onChange={setCategoryCode}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="claru-recorded-at">Recorded at (local time)</Label>
                <Input
                  id="claru-recorded-at"
                  type="datetime-local"
                  step="1"
                  value={recordedAt}
                  onChange={(event) => setRecordedAt(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-duration">Duration in minutes</Label>
                <Input
                  id="claru-duration"
                  type="number"
                  min={0}
                  max={1440}
                  step="any"
                  aria-describedby="claru-duration-help"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  placeholder={`${project.clipLength.minSeconds / 60}–${project.clipLength.maxSeconds / 60}`}
                />
                <p id="claru-duration-help" className="text-xs text-[var(--text-muted)]">
                  Declare the duration you measured. Claru checks the actual file against this
                  project&apos;s {formatClaruDuration(project.clipLength.minSeconds)}–
                  {formatClaruDuration(project.clipLength.maxSeconds)} range at seal.
                </p>
              </div>
            </div>
          </section>

          <section
            className="space-y-4 border-t pt-5"
            style={{ borderColor: 'var(--border-default)' }}
            aria-labelledby="claru-capture-heading"
          >
            <div>
              <h2 id="claru-capture-heading" className="text-sm font-semibold">
                Capture details
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                These values identify who collected the clip and how it was recorded.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="claru-clip-country">Country</Label>
                <Input
                  id="claru-clip-country"
                  value={country}
                  maxLength={2}
                  onChange={(event) => setCountry(event.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-clip-collector">Collector ID</Label>
                <Input
                  id="claru-clip-collector"
                  value={collectorId}
                  maxLength={200}
                  onChange={(event) => setCollectorId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-clip-site">Site ID</Label>
                <Input
                  id="claru-clip-site"
                  value={siteId}
                  maxLength={200}
                  onChange={(event) => setSiteId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-clip-device">Device</Label>
                <Input
                  id="claru-clip-device"
                  value={device}
                  maxLength={300}
                  onChange={(event) => setDevice(event.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="claru-clip-mount">Mount</Label>
                <Input
                  id="claru-clip-mount"
                  value={mount}
                  maxLength={200}
                  onChange={(event) => setMount(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section
            className="space-y-4 border-t pt-5"
            style={{ borderColor: 'var(--border-default)' }}
            aria-labelledby="claru-files-heading"
          >
            <div>
              <h2 id="claru-files-heading" className="text-sm font-semibold">
                Delivery files
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                File names and byte sizes are declared exactly as selected. Video files must be MP4.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {expectedFiles.map((expectation) => (
                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: 'var(--border-default)' }}
                  key={expectation.fileType}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`claru-file-${expectation.fileType}`}>
                      {claruFileTypeLabel(expectation.fileType)}
                    </Label>
                    <span className="text-xs text-[var(--text-muted)]">
                      {expectation.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <input
                    id={`claru-file-${expectation.fileType}`}
                    type="file"
                    accept={acceptByType[expectation.fileType]}
                    multiple={expectation.fileType === 'other'}
                    required={expectation.required}
                    onChange={(event) => setRoleFiles(expectation.fileType, event.target.files)}
                    className="mt-3 block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border file:border-[var(--border-default)] file:bg-[var(--bg-base)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--text-primary)]"
                  />
                  {files[expectation.fileType].length > 0 ? (
                    <p className="mt-2 truncate text-xs text-[var(--text-muted)]">
                      {files[expectation.fileType]
                        .map((file) => `${file.name} (${formatBytes(file.size)})`)
                        .join(', ')}
                    </p>
                  ) : null}
                  {files[expectation.fileType].length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setFiles((current) => ({ ...current, [expectation.fileType]: [] }));
                        const input = document.getElementById(
                          `claru-file-${expectation.fileType}`
                        ) as HTMLInputElement | null;
                        if (input) input.value = '';
                      }}
                    >
                      Clear {claruFileTypeLabel(expectation.fileType).toLowerCase()}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            {hasInputs ? (
              <div className="grid gap-4 rounded-lg bg-[var(--bg-muted)] p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="claru-axis-convention">IMU axis convention</Label>
                  <Input
                    id="claru-axis-convention"
                    value={axisConvention}
                    maxLength={3}
                    onChange={(event) => setAxisConvention(event.target.value.toUpperCase())}
                    placeholder="RDF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claru-video-start-us">Video start, microseconds</Label>
                  <Input
                    id="claru-video-start-us"
                    type="number"
                    step="1"
                    value={videoStartUs}
                    onChange={(event) => setVideoStartUs(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section
            className="space-y-3 border-t pt-5"
            style={{ borderColor: 'var(--border-default)' }}
            aria-labelledby="claru-consent-heading"
          >
            <div>
              <h2 id="claru-consent-heading" className="text-sm font-semibold">
                Consent and footage declaration
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Claru requires all four statements to be true for every clip.
              </p>
            </div>
            {Object.entries(consentLabels).map(([key, label]) => {
              const consentKey = key as ConsentKey;
              return (
                <div className="flex items-start gap-3" key={key}>
                  <Checkbox
                    id={`claru-consent-${key}`}
                    checked={consent[consentKey]}
                    onCheckedChange={(checked) =>
                      setConsent((current) => ({ ...current, [consentKey]: checked === true }))
                    }
                  />
                  <Label
                    htmlFor={`claru-consent-${key}`}
                    className="pt-0.5 text-sm font-normal leading-5"
                  >
                    {label}
                  </Label>
                </div>
              );
            })}
          </section>

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
              {mutation.isPending ? 'Preparing upload…' : 'Continue to upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
