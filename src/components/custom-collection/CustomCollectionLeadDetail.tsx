'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
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
  isTerminalLeadStatus,
  useCustomCollectionLead,
  useUpdateCustomCollectionLeadStatus,
} from '@/hooks/api/useCustomCollection';
import type { CustomCollectionLeadStatus } from '@/types';
import {
  formatCustomCollectionStatus,
  formatDateTime,
  leadStatusSemantic,
  revisionStatusSemantic,
} from './customCollectionAdminUtils';

const NEXT_STATUSES: CustomCollectionLeadStatus[] = [
  'CONTACTED',
  'QUALIFYING',
  'WON',
  'LOST',
  'SPAM',
];

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value || '—'}</p>
    </div>
  );
}

export function CustomCollectionLeadDetail({ leadId }: { leadId: string }) {
  const query = useCustomCollectionLead(leadId);
  const updateMutation = useUpdateCustomCollectionLeadStatus();
  const [targetStatus, setTargetStatus] = useState<CustomCollectionLeadStatus | null>(null);
  const [note, setNote] = useState('');

  const lead = query.data;
  const terminal = lead ? isTerminalLeadStatus(lead.status) : false;
  const noteRequired = targetStatus ? isTerminalLeadStatus(targetStatus) : false;

  const statusCopy = useMemo(() => {
    if (!targetStatus) return null;
    return {
      title: `Mark lead ${formatCustomCollectionStatus(targetStatus).toLowerCase()}`,
      description: isTerminalLeadStatus(targetStatus)
        ? 'Terminal statuses require a note and cannot be changed afterwards.'
        : 'Add a short note for the pipeline timeline if useful.',
    };
  }, [targetStatus]);

  const updateStatus = async () => {
    if (!targetStatus || !lead) return;
    if (noteRequired && !note.trim()) return;
    try {
      await updateMutation.mutateAsync({
        leadId: lead.id,
        status: targetStatus,
        note: note.trim() || undefined,
      });
      setTargetStatus(null);
      setNote('');
    } catch {
      // The mutation hook presents the error and keeps the status note intact.
    }
  };

  if (query.isLoading) {
    return <main className="p-4 sm:p-6">Loading lead…</main>;
  }

  if (query.isError || !lead) {
    return (
      <main className="p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertTitle>Failed to load lead</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>The lead details could not be loaded.</p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <Button asChild variant="ghost" className="-ml-3 mb-4">
          <Link href="/dashboard/custom-collection-leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to leads
          </Link>
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusBadge
              status={formatCustomCollectionStatus(lead.status)}
              semanticType={leadStatusSemantic(lead.status)}
            />
            <h1 className="mt-3 text-2xl font-bold">{lead.fullName}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {lead.organization} ·{' '}
              {lead.submissionType === 'SIGNED_IN_ONE_TAP' ? 'signed-in one-tap' : 'guest form'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <a href={`mailto:${lead.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email buyer
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`tel:${lead.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call buyer
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {!lead.isRequestedRevisionCurrent ? (
            <Alert>
              <AlertTitle>Lead was submitted against an older revision</AlertTitle>
              <AlertDescription>
                Buyer requested revision v{lead.requestedRevisionVersion}; current published
                revision is v{lead.currentRevisionVersion ?? '—'}.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Buyer request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <InfoRow label="Name" value={lead.fullName} />
                <InfoRow label="Organization" value={lead.organization} />
                <InfoRow label="Email" value={lead.email} />
                <InfoRow label="Phone" value={lead.phone} />
                <InfoRow label="Industry" value={lead.industry} />
                <InfoRow label="Preferred format" value={lead.preferredFormat} />
                <InfoRow label="Timeline" value={lead.timeline} />
                <InfoRow label="Created" value={formatDateTime(lead.createdAt)} />
              </div>
              <Separator />
              <InfoRow
                label="Data description"
                value={
                  lead.dataDescription || 'One-tap interest request. Requirements need follow-up.'
                }
              />
              <InfoRow label="Additional notes" value={lead.additionalNotes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requested service snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{lead.requestedRevision.title}</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Revision v{lead.requestedRevision.version}
                  </p>
                </div>
                <StatusBadge
                  status={formatCustomCollectionStatus(lead.requestedRevision.status)}
                  semanticType={revisionStatusSemantic(lead.requestedRevision.status)}
                />
              </div>
              <p className="text-sm">{lead.requestedRevision.shortDescription}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow
                  label="Primary category"
                  value={lead.requestedRevision.primaryCategory.name}
                />
                <InfoRow
                  label="Turnaround"
                  value={`${lead.requestedRevision.estimatedTurnaroundMinDays}–${lead.requestedRevision.estimatedTurnaroundMaxDays} days`}
                />
                <InfoRow label="Deliverables" value={lead.requestedRevision.deliverables} />
                <InfoRow
                  label="Quality assurance"
                  value={lead.requestedRevision.qualityAssurance}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {terminal ? (
                <Alert>
                  <AlertTitle>Terminal lead</AlertTitle>
                  <AlertDescription>This lead is closed and cannot be changed.</AlertDescription>
                </Alert>
              ) : null}
              {NEXT_STATUSES.map((status) => (
                <Button
                  key={status}
                  className="w-full justify-start"
                  variant={status === 'LOST' || status === 'SPAM' ? 'destructive' : 'outline'}
                  disabled={terminal || status === lead.status || updateMutation.isPending}
                  onClick={() => setTargetStatus(status)}
                >
                  Mark {formatCustomCollectionStatus(status).toLowerCase()}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.events.length ? (
                <div className="space-y-4">
                  {lead.events.map((event) => (
                    <div
                      key={event.id}
                      className="border-l pl-3"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      <p className="text-sm font-medium">
                        {event.fromStatus
                          ? `${formatCustomCollectionStatus(event.fromStatus)} → `
                          : ''}
                        {formatCustomCollectionStatus(event.toStatus)}
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
                  No events yet.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        open={Boolean(targetStatus)}
        onOpenChange={(open) => {
          if (!open) {
            setTargetStatus(null);
            setNote('');
          }
        }}
      >
        <DialogContent>
          {statusCopy ? (
            <>
              <DialogHeader>
                <DialogTitle>{statusCopy.title}</DialogTitle>
                <DialogDescription>{statusCopy.description}</DialogDescription>
              </DialogHeader>
              <Textarea
                aria-label={noteRequired ? 'Required status note' : 'Optional status note'}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={noteRequired ? 'Required note' : 'Optional note'}
                rows={5}
                maxLength={3000}
              />
              {noteRequired && !note.trim() ? (
                <p className="text-xs text-[var(--status-error)]">
                  A note is required for terminal statuses.
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={updateMutation.isPending}
                  onClick={() => setTargetStatus(null)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={updateMutation.isPending || (noteRequired && !note.trim())}
                  onClick={updateStatus}
                >
                  Update lead
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
