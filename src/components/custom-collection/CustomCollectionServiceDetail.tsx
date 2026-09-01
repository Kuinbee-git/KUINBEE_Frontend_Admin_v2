'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Archive, CheckCircle2, Clock, ExternalLink, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  useApproveCustomCollectionRevision,
  useArchiveCustomCollectionService,
  useCustomCollectionService,
  usePickCustomCollectionRevision,
  useRejectCustomCollectionRevision,
  useRequestCustomCollectionChanges,
} from '@/hooks/api/useCustomCollection';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { buildUserAppUrl } from '@/lib/utils/url.utils';
import type { CustomCollectionRevision, CustomCollectionRevisionStatus } from '@/types';
import {
  formatCustomCollectionStatus,
  formatDateTime,
  revisionStatusSemantic,
} from './customCollectionAdminUtils';

type ReviewAction = 'approve' | 'request-changes' | 'reject' | 'archive';

const arrayText = (items: string[], other?: string | null) =>
  [...items, ...(other ? [other] : [])].join(', ') || '—';

function FieldBlock({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>
        {value || '—'}
      </p>
    </div>
  );
}

function RevisionPanel({ revision, title }: { revision: CustomCollectionRevision; title: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Revision v{revision.version}
            </p>
          </div>
          <StatusBadge
            status={formatCustomCollectionStatus(revision.status)}
            semanticType={revisionStatusSemantic(revision.status)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {revision.coverImage?.url ? (
          <div
            aria-label={`${revision.title} cover image`}
            className="aspect-[16/7] w-full rounded-lg border bg-cover bg-center"
            role="img"
            style={{
              borderColor: 'var(--border-default)',
              backgroundImage: `url("${revision.coverImage.url}")`,
            }}
          />
        ) : (
          <div
            className="flex aspect-[16/7] items-center justify-center rounded-lg border text-sm"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
          >
            No cover image attached
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold">{revision.title}</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {revision.shortDescription}
          </p>
        </div>

        <Separator />

        <div className="grid gap-5 md:grid-cols-2">
          <FieldBlock label="Primary category" value={revision.primaryCategory.name} />
          <FieldBlock
            label="Secondary categories"
            value={revision.secondaryCategories.map((category) => category.name).join(', ')}
          />
          <FieldBlock
            label="Collection methods"
            value={arrayText(revision.collectionMethods, revision.collectionMethodsOther)}
          />
          <FieldBlock
            label="Data types"
            value={arrayText(revision.dataTypes, revision.dataTypesOther)}
          />
          <FieldBlock
            label="Supported formats"
            value={arrayText(revision.supportedFormats, revision.supportedFormatsOther)}
          />
          <FieldBlock
            label="Industries"
            value={arrayText(revision.industries, revision.industriesOther)}
          />
          <FieldBlock
            label="Geographies"
            value={arrayText(revision.geographies, revision.geographiesOther)}
          />
          <FieldBlock
            label="Languages"
            value={arrayText(revision.languages, revision.languagesOther)}
          />
          <FieldBlock
            label="Turnaround"
            value={`${revision.estimatedTurnaroundMinDays}–${revision.estimatedTurnaroundMaxDays} days`}
          />
          <FieldBlock label="Reviewer" value={revision.reviewedBy?.displayName ?? 'Unassigned'} />
        </div>

        <Separator />

        <div className="space-y-5">
          <FieldBlock label="Description" value={revision.description} />
          <FieldBlock label="Deliverables" value={revision.deliverables} />
          <FieldBlock label="Quality assurance" value={revision.qualityAssurance} />
          <FieldBlock label="Compliance notes" value={revision.complianceNotes} />
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomCollectionServiceDetail({ serviceId }: { serviceId: string }) {
  const searchParams = useSearchParams();
  const fromView = searchParams.get('from');
  const backHref = fromView
    ? `/dashboard/custom-collection-services?view=${encodeURIComponent(fromView)}`
    : '/dashboard/custom-collection-services';
  const { can, user: currentAdmin } = useAuthorization();
  const currentAdminId = currentAdmin?.id;
  const canReviewServices = can({
    anyOf: [PERMISSIONS.CUSTOM_COLLECTION.REVIEW_SERVICES],
  });
  const canManageLeads = can({
    anyOf: [PERMISSIONS.CUSTOM_COLLECTION.MANAGE_LEADS],
  });
  const query = useCustomCollectionService(serviceId);
  const pickMutation = usePickCustomCollectionRevision();
  const approveMutation = useApproveCustomCollectionRevision();
  const changesMutation = useRequestCustomCollectionChanges();
  const rejectMutation = useRejectCustomCollectionRevision();
  const archiveMutation = useArchiveCustomCollectionService();
  const [dialogAction, setDialogAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState('');

  const service = query.data?.service;
  const history = query.data?.history ?? [];
  const reviewRevision = service?.workingRevision ?? service?.publishedRevision ?? null;
  const publishedRevision = service?.publishedRevision ?? null;
  const hasSeparatePublishedRevision = Boolean(
    service?.workingRevision &&
    publishedRevision &&
    service.workingRevision.id !== publishedRevision.id
  );

  const dialogCopy = useMemo(() => {
    switch (dialogAction) {
      case 'approve':
        return {
          title: 'Approve custom service',
          description:
            'This approves the reviewed revision. The supplier controls whether the approved service is public or private. The note is optional.',
          noteLabel: 'Optional approval note',
          confirm: 'Approve service',
          requiresNote: false,
        };
      case 'request-changes':
        return {
          title: 'Request supplier changes',
          description: 'The supplier will receive this note and can revise/resubmit the listing.',
          noteLabel: 'Required change request note',
          confirm: 'Request changes',
          requiresNote: true,
        };
      case 'reject':
        return {
          title: 'Reject custom service',
          description: 'The supplier will receive this rejection note.',
          noteLabel: 'Required rejection reason',
          confirm: 'Reject service',
          requiresNote: true,
        };
      case 'archive':
        return {
          title: 'Archive custom service',
          description: 'Archived services are unavailable publicly and reject new leads.',
          noteLabel: 'Required archive reason',
          confirm: 'Archive service',
          requiresNote: true,
        };
      default:
        return null;
    }
  }, [dialogAction]);

  const isMutating =
    pickMutation.isPending ||
    approveMutation.isPending ||
    changesMutation.isPending ||
    rejectMutation.isPending ||
    archiveMutation.isPending;

  const submitDialogAction = async () => {
    if (!service || !reviewRevision || !dialogAction || !dialogCopy) return;
    if (dialogCopy.requiresNote && !note.trim()) return;

    try {
      if (dialogAction === 'approve') {
        await approveMutation.mutateAsync({
          serviceId: service.id,
          revisionId: reviewRevision.id,
          note: note.trim() || undefined,
        });
      } else if (dialogAction === 'request-changes') {
        await changesMutation.mutateAsync({
          serviceId: service.id,
          revisionId: reviewRevision.id,
          note: note.trim(),
        });
      } else if (dialogAction === 'reject') {
        await rejectMutation.mutateAsync({
          serviceId: service.id,
          revisionId: reviewRevision.id,
          note: note.trim(),
        });
      } else {
        await archiveMutation.mutateAsync({ serviceId: service.id, reason: note.trim() });
      }

      setDialogAction(null);
      setNote('');
    } catch {
      // The mutation hook presents the error and keeps the decision context intact.
    }
  };

  if (query.isLoading) {
    return <main className="p-4 sm:p-6">Loading custom service review…</main>;
  }

  if (query.isError || !service || !reviewRevision) {
    return (
      <main className="p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertTitle>Failed to load custom service</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>The service review could not be loaded.</p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const assignedToCurrentAdmin = Boolean(
    currentAdminId && reviewRevision.reviewedById === currentAdminId
  );
  const canPick =
    canReviewServices &&
    !service.archivedAt &&
    ['SUBMITTED', 'RESUBMITTED'].includes(reviewRevision.status);
  const canResolve =
    canReviewServices &&
    !service.archivedAt &&
    reviewRevision.status === 'UNDER_REVIEW' &&
    assignedToCurrentAdmin;
  const lockedByAnotherReviewer =
    !service.archivedAt && reviewRevision.status === 'UNDER_REVIEW' && !assignedToCurrentAdmin;
  const publicServiceUrl = buildUserAppUrl(`/data-request/services/${service.slug}`);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <Button asChild variant="ghost" className="-ml-3 mb-4">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to custom services
          </Link>
        </Button>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={formatCustomCollectionStatus(reviewRevision.status)}
                semanticType={revisionStatusSemantic(
                  reviewRevision.status as CustomCollectionRevisionStatus
                )}
              />
              {service.archivedAt ? <StatusBadge status="Archived" semanticType="neutral" /> : null}
              {!service.archivedAt && publishedRevision ? (
                <StatusBadge
                  status={service.isPublished ? 'Public' : 'Private'}
                  semanticType={service.isPublished ? 'success' : 'neutral'}
                />
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {reviewRevision.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Submitted by {service.supplier.displayName}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canManageLeads ? (
              <Button asChild variant="outline">
                <Link href={`/dashboard/custom-collection-leads?serviceId=${service.id}`}>
                  View related leads
                </Link>
              </Button>
            ) : null}
            {publishedRevision && service.isPublished && publicServiceUrl ? (
              <Button asChild variant="outline">
                <a href={publicServiceUrl} target="_blank" rel="noopener noreferrer">
                  Public page <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {hasSeparatePublishedRevision && service.workingRevision ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Working revision differs from approved revision</AlertTitle>
              <AlertDescription>
                You are reviewing revision v{service.workingRevision.version}; the current approved
                revision v{publishedRevision?.version} remains{' '}
                {service.isPublished ? 'public' : 'private'}.
              </AlertDescription>
            </Alert>
          ) : null}

          <RevisionPanel
            revision={reviewRevision}
            title={service.workingRevision ? 'Revision under review' : 'Approved revision'}
          />

          {hasSeparatePublishedRevision && publishedRevision ? (
            <RevisionPanel revision={publishedRevision} title="Currently approved revision" />
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="rounded-lg border p-3 text-sm"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <p className="font-medium">Assignment</p>
                <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                  {reviewRevision.reviewedBy
                    ? `${reviewRevision.reviewedBy.displayName} (${reviewRevision.reviewedBy.email})`
                    : 'Unassigned'}
                </p>
              </div>

              {canPick ? (
                <Button
                  className="w-full"
                  disabled={isMutating}
                  onClick={() =>
                    pickMutation.mutate({ serviceId: service.id, revisionId: reviewRevision.id })
                  }
                >
                  Pick review
                </Button>
              ) : null}

              {lockedByAnotherReviewer ? (
                <Alert>
                  <AlertTitle>Assigned to another reviewer</AlertTitle>
                  <AlertDescription>
                    Only {reviewRevision.reviewedBy?.displayName ?? 'the assigned admin'} can
                    approve, reject, or request changes for this revision.
                  </AlertDescription>
                </Alert>
              ) : null}

              {canResolve ? (
                <>
                  <Button
                    className="w-full"
                    disabled={isMutating}
                    onClick={() => setDialogAction('approve')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={isMutating}
                    onClick={() => setDialogAction('request-changes')}
                  >
                    Request changes
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    disabled={isMutating}
                    onClick={() => setDialogAction('reject')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : null}

              {!canPick && !canResolve && !lockedByAnotherReviewer ? (
                <p
                  className="rounded-lg border p-3 text-sm"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                >
                  No review transition is currently available for this revision state.
                </p>
              ) : null}

              <Separator />

              <Button
                className="w-full"
                variant="outline"
                disabled={!canReviewServices || Boolean(service.archivedAt) || isMutating}
                onClick={() => setDialogAction('archive')}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive service
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldBlock label="Created" value={formatDateTime(reviewRevision.createdAt)} />
              <FieldBlock label="Submitted" value={formatDateTime(reviewRevision.submittedAt)} />
              <FieldBlock
                label="Review started"
                value={formatDateTime(reviewRevision.reviewStartedAt)}
              />
              <FieldBlock label="Reviewed" value={formatDateTime(reviewRevision.reviewedAt)} />
              <FieldBlock label="Approved" value={formatDateTime(reviewRevision.approvedAt)} />
              <FieldBlock label="Service published" value={formatDateTime(service.publishedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review history</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length ? (
                <div className="space-y-4">
                  {history.map((event) => (
                    <div
                      key={event.id}
                      className="border-l pl-3"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      <p className="text-sm font-medium">
                        {formatCustomCollectionStatus(event.action)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {event.actorNameSnapshot} · {formatDateTime(event.createdAt)}
                      </p>
                      {event.note ? <p className="mt-2 text-sm">{event.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No review events yet.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        open={Boolean(dialogAction)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogAction(null);
            setNote('');
          }
        }}
      >
        <DialogContent>
          {dialogCopy ? (
            <>
              <DialogHeader>
                <DialogTitle>{dialogCopy.title}</DialogTitle>
                <DialogDescription>{dialogCopy.description}</DialogDescription>
              </DialogHeader>
              <Textarea
                aria-label={dialogCopy.noteLabel}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={dialogCopy.noteLabel}
                rows={6}
                maxLength={dialogAction === 'archive' ? 1000 : 3000}
              />
              {dialogCopy.requiresNote && !note.trim() ? (
                <p className="text-xs text-[var(--status-error)]">
                  A note is required for this action.
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => setDialogAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant={
                    dialogAction === 'reject' || dialogAction === 'archive'
                      ? 'destructive'
                      : 'default'
                  }
                  disabled={isMutating || (dialogCopy.requiresNote && !note.trim())}
                  onClick={submitDialogAction}
                >
                  {dialogCopy.confirm}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
