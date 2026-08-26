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
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useMyPermissions } from '@/hooks/api/useAuth';
import {
  useDataRequirement,
  useDataRequirementAction,
  usePatchDataRequirement,
} from '@/hooks/api/useDataRequirements';
import { useAuthStore } from '@/store/auth.store';
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
import { isDemoDataRequirement } from '@/services/data-requirement.demo';

const USER_APP_URL =
  process.env.NEXT_PUBLIC_USER_APP_URL ||
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
  'http://localhost:5175';

const lines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

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

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
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
  const isDemo = isDemoDataRequirement(requirementId);
  const user = useAuthStore((state) => state.user);
  const permissionQuery = useMyPermissions();
  const permissions = permissionQuery.data ?? [];
  const isSuperadmin = user?.userType === 'SUPERADMIN';
  const canManage = isSuperadmin || permissions.includes('MANAGE_DATA_REQUIREMENTS');
  const canPublish = isSuperadmin || permissions.includes('PUBLISH_DATA_REQUIREMENTS');
  const query = useDataRequirement(requirementId);
  const patchMutation = usePatchDataRequirement();
  const actionMutation = useDataRequirementAction();
  const [formOverrides, setFormOverrides] = useState<FormState | null>(null);
  const [dialogAction, setDialogAction] = useState<DataRequirementAction | null>(null);
  const [actionNote, setActionNote] = useState('');

  if (query.isLoading) {
    return <main className="p-6">Loading data requirement…</main>;
  }
  if (query.isError || !query.data) {
    return (
      <main className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Failed to load requirement</AlertTitle>
          <AlertDescription>Refresh the page or return to the requirements queue.</AlertDescription>
        </Alert>
      </main>
    );
  }

  const requirement = query.data;
  const form = formOverrides ?? toForm(requirement);
  const isPublishReady =
    !!requirement.publicSummary && !!requirement.publicSpecifications?.length;
  const availableActions = actionsFor(requirement.status).filter((action) => {
    if (action === 'publish') return canPublish && isPublishReady;
    if (action === 'unpublish') return canPublish;
    return canManage;
  });
  const update = (key: keyof FormState, value: string) =>
    setFormOverrides((current) => ({
      ...(current ?? toForm(requirement)),
      [key]: value,
    }));
  const isBusy = patchMutation.isPending || actionMutation.isPending;

  const save = () =>
    patchMutation.mutate({
      requirementId,
      expectedVersion: requirement.version,
      title: form.title,
      industry: form.industry,
      dataType: form.dataType,
      publicSummary: form.publicSummary || null,
      publicSpecifications: lines(form.publicSpecifications),
      publicCoverage: lines(form.publicCoverage),
      publicVolume: lines(form.publicVolume),
      publicDeliveryDate: form.publicDeliveryDate || null,
      adminNotes: form.adminNotes || null,
    });

  const confirmAction = async () => {
    if (!dialogAction) return;
    const copy = actionCopy[dialogAction];
    if (copy.needsReason && actionNote.trim().length < 10) return;
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
  };

  const publicUrl = requirement.slug && !isDemo
    ? `${USER_APP_URL.replace(/\/$/, '')}/data-request/active-requirements/${requirement.slug}`
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
              <a href={publicUrl} target="_blank" rel="noreferrer">
                View public page <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {isDemo ? (
            <Alert
              className="requirement-preview-alert"
              style={{
                borderColor: 'color-mix(in srgb, var(--state-info) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--state-info) 7%, transparent)',
              }}
            >
              <AlertTitle>Demo requirement</AlertTitle>
              <AlertDescription>
                This preview record is development-only. Saving and lifecycle actions are disabled.
              </AlertDescription>
            </Alert>
          ) : null}
          <Card className="requirement-panel">
            <CardHeader>
              <CardTitle>Public requirement</CardTitle>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                These are the curated fields shown on the marketplace. Use one item per line for lists.
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
                    onChange={(event) => update('industry', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-type">Data type</Label>
                  <Input
                    id="requirement-type"
                    value={form.dataType}
                    disabled={!canManage}
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
                    placeholder="Internal notes are never shown publicly."
                    onChange={(event) => update('adminNotes', event.target.value)}
                  />
                </div>
              </div>
              {canManage ? (
                <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
                  <Button disabled={isBusy || isDemo} onClick={save}>
                    {patchMutation.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader><CardTitle>Original submission</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <ReadField label="Description" value={requirement.description} />
                <ReadField label="Intended use" value={requirement.intendedUse} />
                <ReadField label="Requested formats" value={requirement.requestedFormats.join(', ')} />
                <ReadField label="Geographies" value={requirement.requestedGeographies.join(', ')} />
                <ReadField label="Languages" value={requirement.requestedLanguages.join(', ')} />
                <ReadField label="Expected volume" value={requirement.expectedVolume} />
                <ReadField label="Target delivery" value={formatDate(requirement.targetDeliveryDate)} />
                <ReadField label="Budget range" value={requirement.budgetRange} />
                <ReadField label="Licensing / compliance" value={requirement.licensingCompliance} />
                <ReadField label="Additional notes" value={requirement.submitterNotes} />
              </div>
              <Separator />
              <details>
                <summary className="cursor-pointer text-sm font-medium">View immutable source payload</summary>
                <pre
                  className="mt-3 max-h-80 overflow-auto rounded-lg border p-3 text-xs"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                >
                  {JSON.stringify(requirement.originalSubmission, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
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
                        <p className="text-sm font-medium">
                          {event.action.toLowerCase().replaceAll('_', ' ')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {event.actorName} · {event.actorType.toLowerCase()}
                        </p>
                        {event.note ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--text-secondary)' }}>
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
            <CardHeader><CardTitle>Lifecycle actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {availableActions.length ? (
                availableActions.map((action) => (
                  <Button
                    key={action}
                    variant={action === 'reject' && !isDemo ? 'destructive' : 'outline'}
                    className="w-full"
                    disabled={isBusy || isDemo}
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
            <CardHeader><CardTitle>Submission origin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ReadField label="Origin" value={sourceLabel(requirement.source)} />
              <ReadField label="Contact" value={requirement.contactName} />
              <ReadField label="Email" value={requirement.contactEmail} />
              <ReadField label="Phone" value={requirement.phone} />
              <ReadField label="Organisation" value={requirement.organization} />
            </CardContent>
          </Card>

          <Card className="requirement-panel">
            <CardHeader><CardTitle>Record details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ReadField label="Reference" value={requirement.referenceCode} />
              <ReadField label="Version" value={String(requirement.version)} />
              <ReadField label="Slug" value={requirement.slug} />
              <ReadField label="Review started" value={formatDateTime(requirement.reviewStartedAt)} />
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
                  {actionCopy[dialogAction].needsReason ? 'Reason (required)' : 'Internal note (optional)'}
                </Label>
                <Textarea
                  id="action-note"
                  value={actionNote}
                  rows={4}
                  onChange={(event) => setActionNote(event.target.value)}
                />
                {actionCopy[dialogAction].needsReason && actionNote.trim().length > 0 && actionNote.trim().length < 10 ? (
                  <p className="text-xs" style={{ color: 'var(--state-error)' }}>
                    Enter at least 10 characters.
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAction(null)}>Cancel</Button>
                <Button
                  variant={dialogAction === 'reject' ? 'destructive' : 'default'}
                  disabled={isBusy || Boolean(actionCopy[dialogAction].needsReason && actionNote.trim().length < 10)}
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
