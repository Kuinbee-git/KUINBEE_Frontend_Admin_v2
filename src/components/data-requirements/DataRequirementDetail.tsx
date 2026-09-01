'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatEnumLabel, StatusBadge } from '@/components/shared/StatusBadge';
import {
  useDataRequirement,
  useDataRequirementAction,
  usePatchDataRequirement,
} from '@/hooks/api/useDataRequirements';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { buildUserAppUrl } from '@/lib/utils/url.utils';
import type {
  DataRequirementAction,
  DataRequirementDetail as Detail,
  DataRequirementStatus,
} from '@/types';
import {
  formatDate,
  formatDateTime,
  sourceLabel,
  statusLabel,
  statusSemantic,
} from './dataRequirementAdminUtils';

const lines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const validateLineItems = (
  label: string,
  items: string[],
  maxItems: number,
  maxItemLength: number
) => {
  if (items.length > maxItems) return `${label} can contain at most ${maxItems} items.`;
  if (items.some((item) => item.length > maxItemLength)) {
    return `Each ${label.toLowerCase()} item must be ${maxItemLength} characters or fewer.`;
  }
  return null;
};

const actionCopy: Record<
  DataRequirementAction,
  { title: string; description: string; confirm: string; needsReason?: boolean }
> = {
  'start-review': {
    title: 'Start review',
    description: 'Move this submission into the review queue.',
    confirm: 'Start review',
  },
  publish: {
    title: 'Publish requirement',
    description: 'This requirement will become visible on the public active requirements page.',
    confirm: 'Publish',
  },
  unpublish: {
    title: 'Unpublish requirement',
    description: 'Remove it from the public page and return it to under review.',
    confirm: 'Unpublish',
  },
  reject: {
    title: 'Reject requirement',
    description: 'Store an internal rejection reason and remove any public visibility.',
    confirm: 'Reject',
    needsReason: true,
  },
  close: {
    title: 'Close requirement',
    description: 'Mark the requirement as complete or no longer accepting supply.',
    confirm: 'Close',
  },
  archive: {
    title: 'Archive requirement',
    description: 'Move this closed or rejected requirement into the archive.',
    confirm: 'Archive',
  },
};

const actionsFor = (status: DataRequirementStatus): DataRequirementAction[] => {
  if (status === 'SUBMITTED') return ['start-review', 'reject'];
  if (status === 'UNDER_REVIEW') return ['publish', 'reject', 'close'];
  if (status === 'PUBLISHED') return ['unpublish', 'close'];
  if (status === 'REJECTED') return ['start-review', 'archive'];
  if (status === 'CLOSED') return ['archive'];
  return [];
};

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
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

type FormState = {
  title: string;
  industry: string;
  dataType: string;
  publicSummary: string;
  publicSpecifications: string;
  publicCoverage: string;
  publicVolume: string;
  publicDeliveryDate: string;
  adminNotes: string;
};

const toForm = (detail: Detail): FormState => ({
  title: detail.title,
  industry: detail.industry,
  dataType: detail.dataType,
  publicSummary: detail.publicSummary || '',
  publicSpecifications: detail.publicSpecifications.join('\n'),
  publicCoverage: detail.publicCoverage.join('\n'),
  publicVolume: detail.publicVolume.join('\n'),
  publicDeliveryDate: detail.publicDeliveryDate?.slice(0, 10) || '',
  adminNotes: detail.adminNotes || '',
});

export function DataRequirementDetail({ requirementId }: { requirementId: string }) {
  const { can } = useAuthorization();
  const canManage = can({ anyOf: [PERMISSIONS.DATA_REQUIREMENTS.MANAGE] });
  const canPublish = can({ anyOf: [PERMISSIONS.DATA_REQUIREMENTS.PUBLISH] });
  const query = useDataRequirement(requirementId);
  const patchMutation = usePatchDataRequirement();
  const actionMutation = useDataRequirementAction();
  const [formOverrides, setFormOverrides] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<DataRequirementAction | null>(null);
  const [actionNote, setActionNote] = useState('');

  if (query.isLoading) {
    return <main className="p-4 sm:p-6">Loading data requirement…</main>;
  }
  if (query.isError || !query.data) {
    return (
      <main className="p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertTitle>Failed to load requirement</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>The requirement details could not be loaded.</p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const requirement = query.data;
  const form = formOverrides ?? toForm(requirement);
  const isPublishReady = !!requirement.publicSummary && !!requirement.publicSpecifications?.length;
  const availableActions = actionsFor(requirement.status).filter((action) => {
    if (action === 'publish') return canPublish && isPublishReady;
    if (action === 'unpublish') return canPublish;
    return canManage;
  });
  const update = (key: keyof FormState, value: string) => {
    setFormError(null);
    setFormOverrides((current) => ({
      ...(current ?? toForm(requirement)),
      [key]: value,
    }));
  };
  const isBusy = patchMutation.isPending || actionMutation.isPending;

  const save = async () => {
    const title = form.title.trim();
    const industry = form.industry.trim();
    const dataType = form.dataType.trim();
    const publicSummary = form.publicSummary.trim();
    const publicSpecifications = lines(form.publicSpecifications);
    const publicCoverage = lines(form.publicCoverage);
    const publicVolume = lines(form.publicVolume);
    const adminNotes = form.adminNotes.trim();

    const validationError =
      (title.length < 5 ? 'Title must contain at least 5 characters.' : null) ||
      (!industry ? 'Industry is required.' : null) ||
      (!dataType ? 'Data type is required.' : null) ||
      (publicSummary && publicSummary.length < 20
        ? 'Public summary must contain at least 20 characters or be left empty.'
        : null) ||
      validateLineItems('Specifications', publicSpecifications, 30, 500) ||
      validateLineItems('Coverage', publicCoverage, 30, 200) ||
      validateLineItems('Volume', publicVolume, 20, 200);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    try {
      await patchMutation.mutateAsync({
        requirementId,
        expectedVersion: requirement.version,
        title,
        industry,
        dataType,
        publicSummary: publicSummary || null,
        publicSpecifications,
        publicCoverage,
        publicVolume,
        publicDeliveryDate: form.publicDeliveryDate || null,
        adminNotes: adminNotes || null,
      });
      setFormOverrides(null);
    } catch {
      // The mutation hook presents the server error and preserves the draft for correction.
    }
  };

  const confirmAction = async () => {
    if (!dialogAction) return;
    const copy = actionCopy[dialogAction];
    if (copy.needsReason && actionNote.trim().length < 10) return;
    try {
      await actionMutation.mutateAsync({
        requirementId,
        action: dialogAction,
        expectedVersion: requirement.version,
        ...(dialogAction === 'reject'
          ? { reason: actionNote.trim() }
          : { note: actionNote.trim() || undefined }),
      });
      setDialogAction(null);
      setActionNote('');
    } catch {
      // The mutation hook presents the error and the confirmation stays open.
    }
  };

  const publicUrl = requirement.slug
    ? buildUserAppUrl(`/data-request/active-requirements/${requirement.slug}`)
    : null;

  return (
    <div
      className="data-requirement-detail min-h-screen"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div
        className="border-b p-4 sm:p-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <Button asChild variant="ghost" className="-ml-3 mb-4">
          <Link href="/dashboard/data-requirements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to requirements
          </Link>
        </Button>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={statusLabel(requirement.status)}
                semanticType={statusSemantic(requirement.status)}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {sourceLabel(requirement.source)}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {requirement.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {requirement.referenceCode} · submitted {formatDate(requirement.createdAt)}
            </p>
          </div>
          {publicUrl && requirement.status === 'PUBLISHED' ? (
            <Button asChild variant="outline">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                View public page <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Public requirement</CardTitle>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                These are the curated fields shown on the marketplace. Use one item per line for
                lists.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requirement-title">Title</Label>
                  <Input
                    id="requirement-title"
                    value={form.title}
                    disabled={!canManage}
                    maxLength={160}
                    onChange={(event) => update('title', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-industry">Industry</Label>
                  <Input
                    id="requirement-industry"
                    value={form.industry}
                    disabled={!canManage}
                    maxLength={150}
                    onChange={(event) => update('industry', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-type">Data type</Label>
                  <Input
                    id="requirement-type"
                    value={form.dataType}
                    disabled={!canManage}
                    maxLength={150}
                    onChange={(event) => update('dataType', event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requirement-summary">Summary</Label>
                  <Textarea
                    id="requirement-summary"
                    value={form.publicSummary}
                    disabled={!canManage}
                    rows={4}
                    maxLength={1200}
                    placeholder="Write the concise summary shown on the marketplace."
                    onChange={(event) => update('publicSummary', event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requirement-specifications">Specifications</Label>
                  <Textarea
                    id="requirement-specifications"
                    value={form.publicSpecifications}
                    disabled={!canManage}
                    rows={6}
                    maxLength={15029}
                    placeholder="Add one public specification per line."
                    onChange={(event) => update('publicSpecifications', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-coverage">Coverage</Label>
                  <Textarea
                    id="requirement-coverage"
                    value={form.publicCoverage}
                    disabled={!canManage}
                    rows={4}
                    maxLength={6029}
                    placeholder="Add one geography or language per line."
                    onChange={(event) => update('publicCoverage', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-volume">Volume</Label>
                  <Textarea
                    id="requirement-volume"
                    value={form.publicVolume}
                    disabled={!canManage}
                    rows={4}
                    maxLength={4019}
                    placeholder="Add one volume milestone per line."
                    onChange={(event) => update('publicVolume', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-delivery">Delivery date</Label>
                  <Input
                    id="requirement-delivery"
                    type="date"
                    value={form.publicDeliveryDate}
                    disabled={!canManage}
                    onChange={(event) => update('publicDeliveryDate', event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requirement-admin-notes">Internal admin notes</Label>
                  <Textarea
                    id="requirement-admin-notes"
                    value={form.adminNotes}
                    disabled={!canManage}
                    rows={3}
                    maxLength={5000}
                    placeholder="Internal notes are never shown publicly."
                    onChange={(event) => update('adminNotes', event.target.value)}
                  />
                </div>
              </div>
              {formError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Check the requirement fields</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              {canManage ? (
                <div
                  className="flex justify-end border-t pt-4"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <Button disabled={isBusy} onClick={save}>
                    {patchMutation.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Original submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <ReadField label="Description" value={requirement.description} />
                <ReadField label="Intended use" value={requirement.intendedUse} />
                <ReadField
                  label="Requested formats"
                  value={requirement.requestedFormats.join(', ')}
                />
                <ReadField
                  label="Geographies"
                  value={requirement.requestedGeographies.join(', ')}
                />
                <ReadField label="Languages" value={requirement.requestedLanguages.join(', ')} />
                <ReadField label="Expected volume" value={requirement.expectedVolume} />
                <ReadField
                  label="Target delivery"
                  value={formatDate(requirement.targetDeliveryDate)}
                />
                <ReadField label="Budget range" value={requirement.budgetRange} />
                <ReadField label="Licensing / compliance" value={requirement.licensingCompliance} />
                <ReadField label="Additional notes" value={requirement.submitterNotes} />
              </div>
              <Separator />
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  View immutable source payload
                </summary>
                <pre
                  className="mt-3 max-h-80 overflow-auto rounded-lg border p-3 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  {JSON.stringify(requirement.originalSubmission, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {[...requirement.events].reverse().map((event, index) => (
                  <div key={event.id} className="relative pl-6">
                    {index < requirement.events.length - 1 ? (
                      <span
                        className="absolute bottom-[-20px] left-[5px] top-3 w-px"
                        style={{ backgroundColor: 'var(--border-default)' }}
                      />
                    ) : null}
                    <span
                      className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--state-info)',
                      }}
                    />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatEnumLabel(event.action)}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {event.actorName} · {formatEnumLabel(event.actorType)}
                        </p>
                        {event.note ? (
                          <p
                            className="mt-2 whitespace-pre-wrap text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {event.note}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(event.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Lifecycle actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableActions.length ? (
                availableActions.map((action) => (
                  <Button
                    key={action}
                    variant={action === 'reject' ? 'destructive' : 'outline'}
                    className="w-full"
                    disabled={isBusy}
                    onClick={() => {
                      setDialogAction(action);
                      setActionNote('');
                    }}
                  >
                    {actionCopy[action].confirm}
                  </Button>
                ))
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No actions are available for this status or your permissions.
                </p>
              )}
              {requirement.status === 'UNDER_REVIEW' &&
              (!requirement.publicSummary || !requirement.publicSpecifications.length) ? (
                <Alert>
                  <AlertTitle>Not ready to publish</AlertTitle>
                  <AlertDescription>
                    Add a public summary and at least one specification first.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Submission origin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReadField label="Origin" value={sourceLabel(requirement.source)} />
              <ReadField label="Contact" value={requirement.contactName} />
              <ReadField label="Email" value={requirement.contactEmail} />
              <ReadField label="Phone" value={requirement.phone} />
              <ReadField label="Organisation" value={requirement.organization} />
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Record details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReadField label="Reference" value={requirement.referenceCode} />
              <ReadField label="Version" value={String(requirement.version)} />
              <ReadField label="Slug" value={requirement.slug} />
              <ReadField
                label="Review started"
                value={formatDateTime(requirement.reviewStartedAt)}
              />
              <ReadField label="Published" value={formatDateTime(requirement.publishedAt)} />
              <ReadField label="Rejected" value={formatDateTime(requirement.rejectedAt)} />
              <ReadField label="Closed" value={formatDateTime(requirement.closedAt)} />
              <ReadField label="Archived" value={formatDateTime(requirement.archivedAt)} />
              {requirement.rejectionReason ? (
                <ReadField label="Rejection reason" value={requirement.rejectionReason} />
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={Boolean(dialogAction)} onOpenChange={(open) => !open && setDialogAction(null)}>
        <DialogContent>
          {dialogAction ? (
            <>
              <DialogHeader>
                <DialogTitle>{actionCopy[dialogAction].title}</DialogTitle>
                <DialogDescription>{actionCopy[dialogAction].description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="action-note">
                  {actionCopy[dialogAction].needsReason
                    ? 'Reason (required)'
                    : 'Internal note (optional)'}
                </Label>
                <Textarea
                  id="action-note"
                  value={actionNote}
                  rows={4}
                  maxLength={3000}
                  onChange={(event) => setActionNote(event.target.value)}
                />
                <p className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                  {actionNote.length}/3000
                </p>
                {actionCopy[dialogAction].needsReason &&
                actionNote.trim().length > 0 &&
                actionNote.trim().length < 10 ? (
                  <p className="text-xs" style={{ color: 'var(--state-error)' }}>
                    Enter at least 10 characters.
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant={dialogAction === 'reject' ? 'destructive' : 'default'}
                  disabled={
                    isBusy ||
                    Boolean(actionCopy[dialogAction].needsReason && actionNote.trim().length < 10)
                  }
                  onClick={confirmAction}
                >
                  {actionMutation.isPending ? 'Updating…' : actionCopy[dialogAction].confirm}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
