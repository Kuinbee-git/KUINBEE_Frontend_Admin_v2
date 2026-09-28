'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailSkeleton } from '@/components/shared/DetailSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  useClaruBatch,
  useClaruProjects,
  useClaruSubmission,
  useSealClaruSubmission,
  useSyncClaruSubmission,
} from '@/hooks/api/useClaru';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { useClaruUploadStore } from '@/store/claru-upload.store';
import type { ClaruSubmission } from '@/types';
import { formatDateTime } from '@/utils/date.utils';
import { ClaruResumeUploadDialog } from './ClaruResumeUploadDialog';
import { ClaruTransferPanel } from './ClaruTransferPanel';
import {
  claruFileTypeLabel,
  claruStateLabel,
  claruStateSemantic,
  formatBytes,
  formatClaruDuration,
} from './claruAdminUtils';

function detailsRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function refusalDetails(submission: ClaruSubmission) {
  const details = detailsRecord(submission.lastRefusal?.details);
  const remedy = typeof details?.remedy === 'string' ? details.remedy : null;
  const refusals = Array.isArray(details?.refusals)
    ? details.refusals.flatMap((entry) => {
        const item = detailsRecord(entry);
        if (!item) return [];
        const nested = detailsRecord(item.details);
        const code = typeof item.code === 'string' ? item.code : null;
        const message =
          typeof item.remedy === 'string'
            ? item.remedy
            : typeof nested?.remedy === 'string'
              ? nested.remedy
              : typeof item.message === 'string'
                ? item.message
                : null;
        return code || message ? [{ code, message }] : [];
      })
    : [];
  return { remedy, refusals };
}

function sealSummary(seal: unknown) {
  const value = detailsRecord(seal);
  if (!value) return null;
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.flatMap((warning) => {
        const item = detailsRecord(warning);
        return typeof item?.message === 'string' ? [item.message] : [];
      })
    : [];
  return {
    at: typeof value.at === 'string' ? value.at : null,
    duplicateCheck: typeof value.duplicateCheck === 'string' ? value.duplicateCheck : null,
    sensorSetAside: value.sensorSetAside === true,
    warnings,
  };
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

export function ClaruSubmissionDetail({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const { can } = useAuthorization();
  const submissionQuery = useClaruSubmission(submissionId);
  const batchQuery = useClaruBatch(submissionQuery.data?.batchId ?? '');
  const projectsQuery = useClaruProjects();
  const sealMutation = useSealClaruSubmission();
  const syncMutation = useSyncClaruSubmission();
  const [sealOpen, setSealOpen] = useState(false);
  const staged = useClaruUploadStore((state) => state.pendingBySubmissionId[submissionId]);

  const submission = submissionQuery.data;
  const project = projectsQuery.data?.projects.find((item) => item.id === submission?.projectId);
  const category = project?.categories.find(
    (item) => item.code === submission?.declared.categoryCode
  );
  const seal = useMemo(() => sealSummary(submission?.seal), [submission?.seal]);

  if (submissionQuery.isLoading) return <DetailSkeleton />;

  if (submissionQuery.isError || !submission) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="mx-auto max-w-xl">
          <CardContent className="py-12 text-center">
            <p className="font-medium">Clip delivery could not be loaded</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              It may no longer exist, or the backend is unavailable.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/claru')}>
                Back to deliveries
              </Button>
              <Button onClick={() => submissionQuery.refetch()}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const batch = batchQuery.data;
  const pendingParts = submission.parts.filter((part) => part.uploadState === 'pending');
  const allUploaded = pendingParts.length === 0 && submission.parts.length > 0;
  const editable = ['draft', 'refused', 'expired'].includes(submission.state);
  const canManage = can({ anyOf: [PERMISSIONS.CLARU.MANAGE] });
  const canSeal = can({ anyOf: [PERMISSIONS.CLARU.SEAL] });
  const blocked = projectsQuery.data?.team.blocked;
  const hasStagedUpload = Boolean(
    staged?.result.uploadInstructions.some((part) => part.uploadState === 'pending')
  );
  const canSealNow =
    canSeal &&
    !blocked &&
    !hasStagedUpload &&
    allUploaded &&
    (submission.state === 'draft' || submission.state === 'refused');
  const canPrepareFiles = editable && !blocked && !sealMutation.isPending;
  const refusal = refusalDetails(submission);

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] [&_h1]:break-all">
      <PageHeader
        title={submission.externalRef}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={claruStateLabel(submission.state)}
              semanticType={claruStateSemantic(submission.state)}
            />
            <span>{batch?.name ?? 'Claru delivery batch'}</span>
          </span>
        }
        onBack={() =>
          router.push(batch ? `/dashboard/claru/batches/${batch.id}` : '/dashboard/claru')
        }
        backLabel="Back to delivery batch"
        actions={
          <div className="flex flex-wrap gap-2">
            {submission.claruSubmissionId ? (
              <Button
                variant="outline"
                disabled={syncMutation.isPending || sealMutation.isPending || hasStagedUpload}
                onClick={() => syncMutation.mutate(submission.id)}
              >
                {syncMutation.isPending ? 'Refreshing…' : 'Refresh status'}
              </Button>
            ) : null}
            {canManage && canPrepareFiles && !hasStagedUpload ? (
              <ClaruResumeUploadDialog submission={submission} project={project} />
            ) : null}
            {canSealNow ? (
              <Button
                disabled={sealMutation.isPending}
                onClick={() => {
                  sealMutation.reset();
                  setSealOpen(true);
                }}
              >
                Seal submission
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="space-y-5 p-4 sm:p-6">
        {blocked ? (
          <Card
            role="alert"
            className="border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]"
          >
            <CardContent className="p-4 text-sm">
              Claru delivery is blocked: {blocked.remedy}
            </CardContent>
          </Card>
        ) : null}
        <Card className="shadow-none">
          <CardContent className="p-4 sm:p-5">
            <ol className="grid grid-cols-3 gap-3 text-sm" aria-label="Delivery steps">
              {['Declare clip', 'Upload files', 'Seal and review'].map((label, index) => {
                const current = submission.sealed ? 2 : allUploaded && !hasStagedUpload ? 2 : 1;
                return (
                  <li
                    key={label}
                    aria-current={current === index ? 'step' : undefined}
                    className={
                      index === current
                        ? 'font-semibold text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                    }
                  >
                    <span
                      className="mb-2 block h-1 rounded-full"
                      style={{
                        backgroundColor:
                          index <= current ? 'var(--action-primary)' : 'var(--border-default)',
                      }}
                    />
                    {index + 1}. {label}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              {submission.sealed
                ? submission.state === 'approved'
                  ? 'Claru approved this clip.'
                  : submission.state === 'rejected'
                    ? 'Review the rejection below. Corrected footage needs a new clip reference.'
                    : 'Claru is processing or reviewing this clip. Sealing is acceptance for review; approval comes later.'
                : submission.state === 'expired'
                  ? 'Restart this expired delivery under the same clip reference.'
                  : submission.lastRefusal
                    ? 'Review the failed checks below and correct the submission before sealing again.'
                    : allUploaded && !hasStagedUpload
                      ? canSeal
                        ? 'All files are stored. Review the declaration, then seal this submission to send it to Claru.'
                        : 'All files are stored. An admin with seal permission must submit this clip to Claru.'
                      : hasStagedUpload
                        ? 'Your files are selected. Start the transfer below.'
                        : canManage
                          ? 'Resume the upload by selecting the original unfinished files.'
                          : 'A delivery manager needs to finish uploading the files.'}
            </p>
          </CardContent>
        </Card>
        {canManage && editable && !blocked ? (
          <ClaruTransferPanel key={submission.id} submissionId={submission.id} />
        ) : null}

        {submission.state === 'refused' ||
        (submission.state === 'draft' && submission.lastRefusal) ? (
          <Card
            className="border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] shadow-none"
            role="alert"
          >
            <CardContent className="p-4 sm:p-5">
              <p className="font-semibold text-[var(--status-warning)]">
                Claru refused this submission
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {submission.lastRefusal?.code}: {submission.lastRefusal?.message}
              </p>
              {refusal.remedy ? (
                <p className="mt-2 text-sm text-[var(--text-primary)]">Remedy: {refusal.remedy}</p>
              ) : null}
              {refusal.refusals.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    All failed checks
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--text-primary)]">
                    {refusal.refusals.map((item, index) => (
                      <li
                        className="rounded-md border border-[var(--status-warning-border)] px-3 py-2"
                        key={`${item.code ?? 'refusal'}-${index}`}
                      >
                        {item.code ? <span className="font-medium">{item.code}</span> : null}
                        {item.code && item.message ? ': ' : null}
                        {item.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Correct the named problem and continue under this same external reference.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {submission.rejection ? (
          <Card
            className="border-[var(--status-error-border)] bg-[var(--status-error-bg)] shadow-none"
            role="alert"
          >
            <CardContent className="p-4 sm:p-5">
              <p className="font-semibold text-[var(--status-error)]">
                Clip rejected after acceptance
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {submission.rejection.code}: {submission.rejection.reason}
              </p>
              {submission.rejection.checks.length > 0 ? (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Failed checks: {submission.rejection.checks.join(', ')}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-[var(--status-error)]">
                A corrected clip must use a new external reference.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {submission.state === 'expired' ? (
          <Card className="border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] shadow-none">
            <CardContent className="p-4 text-sm text-[var(--status-warning)]">
              This draft expired before sealing. Reselect its files and resume under the same
              external reference.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery files</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table className="[&_td]:px-5 [&_td]:py-3 [&_th]:px-5">
                  <TableHeader>
                    <TableRow className="bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]">
                      <TableHead>Role and file</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Transfer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submission.parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{claruFileTypeLabel(part.fileType)}</p>
                          <p className="mt-0.5 max-w-md truncate text-xs text-[var(--text-muted)]">
                            {part.fileName}
                          </p>
                        </TableCell>
                        <TableCell>{formatBytes(part.byteSize)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={part.uploadState === 'uploaded' ? 'Complete' : 'Pending'}
                            semanticType={part.uploadState === 'uploaded' ? 'success' : 'neutral'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {allUploaded && submission.state === 'draft' ? (
                <div
                  className="border-t px-5 py-4 text-sm text-[var(--text-secondary)]"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  Every declared file is complete. An authorized admin can now seal the submission.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Capture declaration</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Definition
                    label="Category"
                    value={category?.name ?? submission.declared.categoryCode ?? 'Not required'}
                  />
                  <Definition label="Country" value={submission.declared.country} />
                  <Definition label="Collector" value={submission.declared.collectorId} />
                  <Definition label="Site" value={submission.declared.siteId} />
                  <Definition label="Device" value={submission.declared.device} />
                  <Definition label="Mount" value={submission.declared.mount} />
                  <Definition
                    label="Duration"
                    value={formatClaruDuration(submission.declared.durationSeconds)}
                  />
                  <Definition
                    label="Recorded"
                    value={formatDateTime(submission.declared.recordedAt)}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Delivery record</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Definition label="Contract" value={`v${submission.contractVersion}`} />
                  <Definition
                    label="Last synchronized"
                    value={formatDateTime(submission.lastSyncedAt)}
                  />
                  <Definition
                    label="Claru submission"
                    value={submission.claruSubmissionId ?? 'Not created'}
                  />
                  <Definition
                    label="Annotation"
                    value={submission.annotationId ?? 'Not assigned'}
                  />
                  {seal?.at ? <Definition label="Sealed" value={formatDateTime(seal.at)} /> : null}
                  {seal?.duplicateCheck ? (
                    <Definition label="Duplicate check" value={seal.duplicateCheck} />
                  ) : null}
                </dl>
                {seal?.sensorSetAside ? (
                  <p className="mt-4 rounded-md bg-[var(--status-warning-bg)] px-3 py-2 text-sm text-[var(--status-warning)]">
                    The sensor file was retained but excluded from processing.
                  </p>
                ) : null}
                {seal && seal.warnings.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Seal warnings
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                      {seal.warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={sealOpen}
        onOpenChange={(next) => {
          if (!sealMutation.isPending) setSealOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seal this Claru submission?</DialogTitle>
            <DialogDescription>
              Claru will validate the uploaded bytes, metadata, consent, duplicates, and project
              checks. A successful seal creates the review clip and locks this declaration.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-[var(--bg-muted)] p-4 text-sm">
            <p className="font-medium">{submission.externalRef}</p>
            <p className="mt-1 text-[var(--text-muted)]">
              {submission.parts.length} files ·{' '}
              {formatClaruDuration(submission.declared.durationSeconds)}
            </p>
          </div>
          {sealMutation.isPending ? (
            <p role="status" className="text-sm text-[var(--text-muted)]">
              Claru is checking the uploaded media. This may take over 30 seconds. Keep this dialog
              open.
            </p>
          ) : null}
          {sealMutation.isError ? (
            <p role="alert" className="text-sm text-[var(--status-error)]">
              {getFriendlyErrorMessage(sealMutation.error)} Check the submission status before
              retrying if the request timed out.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={sealMutation.isPending}
              onClick={() => setSealOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={sealMutation.isPending}
              onClick={() =>
                sealMutation.mutate(submission.id, {
                  onSuccess: () => setSealOpen(false),
                  onError: (error) => {
                    if (
                      error &&
                      typeof error === 'object' &&
                      'statusCode' in error &&
                      error.statusCode === 422
                    )
                      setSealOpen(false);
                  },
                })
              }
            >
              {sealMutation.isPending ? 'Sealing…' : 'Seal and submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
