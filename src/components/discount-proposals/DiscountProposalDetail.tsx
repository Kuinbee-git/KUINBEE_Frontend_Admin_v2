'use client';

import { useState } from 'react';
import Link from 'next/link';

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
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, formatStatusLabel } from '@/components/shared/StatusBadge';
import {
  useApproveDiscountProposal,
  useDiscountProposalReview,
  useRejectDiscountProposal,
} from '@/hooks/api/useDiscountProposals';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import {
  discountStatusSemantic,
  formatDateTime,
  formatDiscount,
  formatMoney,
  surfaceLabel,
} from './discountProposalAdminUtils';

type ReviewAction = 'approve' | 'reject' | null;

function InfoBlock({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: muted ? 'var(--text-secondary)' : 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

function NotesBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="mt-2 whitespace-pre-wrap text-sm leading-6"
        style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {value || 'No notes provided.'}
      </p>
    </div>
  );
}

export function DiscountProposalDetail({ discountProposalId }: { discountProposalId: string }) {
  const query = useDiscountProposalReview(discountProposalId);
  const { can } = useAuthorization();
  const approveMutation = useApproveDiscountProposal();
  const rejectMutation = useRejectDiscountProposal();
  const [action, setAction] = useState<ReviewAction>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = can({ anyOf: [PERMISSIONS.DATASETS.APPROVE] });
  const canReject = can({ anyOf: [PERMISSIONS.DATASETS.REJECT] });
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const closeDialog = () => {
    if (isMutating) return;
    setAction(null);
    setAdminNotes('');
    setRejectionReason('');
  };

  const confirmAction = async () => {
    try {
      if (action === 'approve') {
        await approveMutation.mutateAsync({
          discountProposalId,
          data: { adminNotes: adminNotes.trim() || undefined },
        });
        closeDialog();
        return;
      }

      if (action === 'reject' && rejectionReason.trim()) {
        await rejectMutation.mutateAsync({
          discountProposalId,
          data: {
            rejectionReason: rejectionReason.trim(),
            adminNotes: adminNotes.trim() || undefined,
          },
        });
        closeDialog();
      }
    } catch {
      // The mutation hook reports the API error and the dialog stays open.
    }
  };

  if (query.isLoading) {
    return (
      <div className="p-6">
        <div
          className="h-64 animate-pulse rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Could not load this discount proposal</AlertTitle>
          <AlertDescription>
            It may have been removed, or you may not have permission to review it.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/discount-proposals">Back to proposals</Link>
          </Button>
          <Button variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const item = query.data;
  const proposal = item.discountProposal;
  const canReview = proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW';
  const lacksActionPermission = canReview && !canApprove && !canReject;

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard/discount-proposals"
              className="text-sm hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Discount proposals
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.dataset.title}
              </h1>
              <StatusBadge
                status={formatStatusLabel(proposal.status)}
                semanticType={discountStatusSemantic(proposal.status)}
              />
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {item.dataset.datasetUniqueId} · {surfaceLabel(proposal.targetSurface)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/dashboard/datasets/${item.dataset.id}`}>Open dataset</Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Pricing impact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <InfoBlock label="Discount" value={formatDiscount(proposal)} />
                <InfoBlock
                  label="Discount type"
                  value={proposal.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed amount'}
                />
                <InfoBlock
                  label="Base price snapshot"
                  value={formatMoney(proposal.basePriceSnapshot, proposal.currencySnapshot)}
                  muted
                />
                <InfoBlock
                  label="Discounted price"
                  value={formatMoney(proposal.finalPriceSnapshot, proposal.currencySnapshot)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign and submission</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <InfoBlock label="Starts" value={formatDateTime(proposal.startsAt)} />
                <InfoBlock label="Ends" value={formatDateTime(proposal.endsAt)} />
                <InfoBlock
                  label="Submitted"
                  value={formatDateTime(proposal.submittedAt ?? proposal.createdAt)}
                />
                <InfoBlock label="Last updated" value={formatDateTime(proposal.updatedAt)} />
                <InfoBlock
                  label="Supplier"
                  value={item.supplier?.name || item.supplier?.email || 'Supplier'}
                />
                <InfoBlock label="Supplier email" value={item.supplier?.email || '—'} muted />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <NotesBlock label="Supplier notes" value={proposal.supplierNotes} />
                {proposal.rejectionReason ? (
                  <NotesBlock
                    label="Rejection reason sent to supplier"
                    value={proposal.rejectionReason}
                  />
                ) : null}
                {proposal.adminNotes ? (
                  <NotesBlock label="Internal admin notes" value={proposal.adminNotes} />
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent>
                {canReview ? (
                  <>
                    <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                      Confirm the price snapshot and campaign dates before deciding. The backend
                      rechecks current pricing and overlapping campaigns when you approve.
                    </p>
                    <div className="mt-5 grid gap-2">
                      {canApprove ? (
                        <Button onClick={() => setAction('approve')}>Approve proposal</Button>
                      ) : null}
                      {canReject ? (
                        <Button
                          variant="outline"
                          className="border-[var(--status-error-border)] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] hover:text-[var(--status-error)]"
                          onClick={() => setAction('reject')}
                        >
                          Reject proposal
                        </Button>
                      ) : null}
                      {lacksActionPermission ? (
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          You can view this proposal, but your role cannot approve or reject it.
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                    This proposal has already left the reviewable state. No further decision is
                    available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoBlock label="Reviewed" value={formatDateTime(proposal.reviewedAt)} />
                <InfoBlock label="Approved" value={formatDateTime(proposal.approvedAt)} />
                <InfoBlock
                  label="Reviewed by"
                  value={item.reviewer?.name || item.reviewer?.email || '—'}
                  muted
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={action !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve this discount proposal?' : 'Reject this proposal?'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'The approved campaign will take effect for its configured price surface and window.'
                : 'Give the supplier a clear reason they can act on.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'reject' ? (
              <div>
                <label className="text-sm font-medium" htmlFor="discount-rejection-reason">
                  Rejection reason
                </label>
                <Textarea
                  id="discount-rejection-reason"
                  className="mt-2"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Explain what the supplier needs to change"
                  rows={4}
                  maxLength={3000}
                />
              </div>
            ) : null}
            <div>
              <label className="text-sm font-medium" htmlFor="discount-admin-notes">
                Internal admin notes{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="discount-admin-notes"
                className="mt-2"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                placeholder="Add context for other admins"
                rows={3}
                maxLength={3000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isMutating}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={isMutating || (action === 'reject' && !rejectionReason.trim())}
              className={
                action === 'reject'
                  ? 'bg-[var(--action-destructive)] text-[var(--action-on-status)] hover:opacity-90'
                  : undefined
              }
            >
              {isMutating
                ? 'Saving...'
                : action === 'approve'
                  ? 'Confirm approval'
                  : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
