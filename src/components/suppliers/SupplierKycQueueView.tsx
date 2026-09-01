'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import {
  formatStatusLabel,
  getSemanticStatusStyle,
  type SemanticStatus,
} from '@/components/shared/StatusBadge';
import { useAuthStore } from '@/store/auth.store';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import {
  useSupplierManualKycQueue,
  usePickSupplierManualKyc,
  useVerifySupplierManualKyc,
  useRejectSupplierManualKyc,
} from '@/hooks';
import type { ManualKycStatus, SupplierManualKycQueueItem } from '@/types';

const statusSemantic: Record<ManualKycStatus, SemanticStatus> = {
  PENDING: 'pending',
  VERIFIED: 'success',
  REJECTED: 'error',
};

type DecisionTarget = {
  action: 'verify' | 'reject';
  supplierId: string;
  supplierName: string;
};

export function SupplierKycQueueView() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { can } = useAuthorization();
  const canManageVerification = can({
    anyOf: [PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION],
  });
  const canViewSupplier = can({
    anyOf: [PERMISSIONS.SUPPLIERS.VIEW, PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION],
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<ManualKycStatus>('PENDING');
  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const queueQuery = useSupplierManualKycQueue({
    page,
    pageSize,
    status: statusFilter,
  });

  const pickMutation = usePickSupplierManualKyc();
  const verifyMutation = useVerifySupplierManualKyc();
  const rejectMutation = useRejectSupplierManualKyc();

  const items = queueQuery.data?.items || [];
  const total = queueQuery.data?.pagination.total || 0;
  const totalPages = Math.max(
    1,
    queueQuery.data?.pagination
      ? Math.ceil(queueQuery.data.pagination.total / queueQuery.data.pagination.pageSize)
      : 1
  );

  const isAnyActionPending =
    pickMutation.isPending || verifyMutation.isPending || rejectMutation.isPending;

  const canVerifyOrReject = useMemo(
    () => (pickedByAdminId: string | null) =>
      Boolean(pickedByAdminId && pickedByAdminId === user?.id),
    [user?.id]
  );

  const handlePick = async (supplierId: string) => {
    try {
      await pickMutation.mutateAsync(supplierId);
    } catch {
      // The mutation hook presents the backend error.
    }
  };

  const closeDecisionDialog = () => {
    if (isAnyActionPending) return;
    setDecisionTarget(null);
    setRejectionReason('');
  };

  const handleDecision = async () => {
    if (!decisionTarget) return;
    const reason = rejectionReason.trim();
    if (decisionTarget.action === 'reject' && reason.length < 3) return;

    try {
      if (decisionTarget.action === 'verify') {
        await verifyMutation.mutateAsync(decisionTarget.supplierId);
      } else {
        await rejectMutation.mutateAsync({
          supplierId: decisionTarget.supplierId,
          data: { rejectionReason: reason },
        });
      }
      if (items.length === 1 && page > 1) setPage((current) => Math.max(1, current - 1));
      setDecisionTarget(null);
      setRejectionReason('');
    } catch {
      // The mutation hook presents the backend error and the dialog stays open.
    }
  };

  const getDecisionLabel = (item: SupplierManualKycQueueItem) =>
    item.verifiedAt
      ? `Verified ${new Date(item.verifiedAt).toLocaleString()}`
      : item.rejectedAt
        ? `Rejected ${new Date(item.rejectedAt).toLocaleString()}`
        : item.pickedAt
          ? `Picked ${new Date(item.pickedAt).toLocaleString()}`
          : 'Awaiting pick';

  const renderActions = (item: SupplierManualKycQueueItem) => {
    const canProcess = canManageVerification && canVerifyOrReject(item.pickedByAdminId);
    const isPending = item.status === 'PENDING';
    const canPick = canManageVerification && isPending && !item.pickedByAdminId;

    return (
      <div className="flex flex-wrap items-center gap-2 md:inline-flex md:justify-end">
        {canViewSupplier ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/suppliers/${item.supplierId}`)}
            disabled={isAnyActionPending}
          >
            View
          </Button>
        ) : null}
        {canPick ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePick(item.supplierId)}
            disabled={isAnyActionPending}
          >
            Pick
          </Button>
        ) : null}
        {isPending && canProcess ? (
          <>
            <Button
              size="sm"
              onClick={() =>
                setDecisionTarget({
                  action: 'verify',
                  supplierId: item.supplierId,
                  supplierName: item.supplier.name,
                })
              }
              disabled={isAnyActionPending}
            >
              Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                setDecisionTarget({
                  action: 'reject',
                  supplierId: item.supplierId,
                  supplierName: item.supplier.name,
                })
              }
              disabled={isAnyActionPending}
            >
              Reject
            </Button>
          </>
        ) : null}
        {isPending && item.pickedByAdminId && !canProcess ? (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Assigned to another reviewer
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Supplier KYC Queue
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Review manual supplier KYC submissions and process pick, verify, or reject actions.
        </p>
      </div>

      <div
        className="border-b p-4 sm:px-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ManualKycStatus);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter supplier KYC submissions by status"
              className="w-full sm:w-[220px]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {queueQuery.isLoading ? (
            <TableSkeleton columns={6} rows={6} />
          ) : queueQuery.isError ? (
            <div className="p-8 text-center">
              <p className="font-medium text-[var(--state-error)]">
                Failed to load supplier KYC queue
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {getFriendlyErrorMessage(queueQuery.error)}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => queueQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                No suppliers in queue
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Try changing filters or check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {items.map((item) => (
                  <article
                    key={item.supplierId}
                    className="rounded-lg border p-4"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2
                          className="truncate font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.supplier.name}
                        </h2>
                        <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.supplier.email}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        style={getSemanticStatusStyle(statusSemantic[item.status])}
                      >
                        {formatStatusLabel(item.status)}
                      </Badge>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Submitted
                        </dt>
                        <dd className="mt-0.5" style={{ color: 'var(--text-primary)' }}>
                          {new Date(item.submittedAt).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Reviewer
                        </dt>
                        <dd className="mt-0.5" style={{ color: 'var(--text-primary)' }}>
                          {item.pickedByAdmin?.name ?? 'Unassigned'}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Decision
                        </dt>
                        <dd className="mt-0.5" style={{ color: 'var(--text-primary)' }}>
                          {getDecisionLabel(item)}
                        </dd>
                      </div>
                    </dl>

                    {item.rejectionReason ? (
                      <p className="mt-3 text-sm text-[var(--state-error)]">
                        {item.rejectionReason}
                      </p>
                    ) : null}

                    <div
                      className="mt-4 border-t pt-3"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {renderActions(item)}
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden md:block">
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow style={{ borderColor: 'var(--border-default)' }}>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.supplierId}
                        style={{ borderColor: 'var(--border-default)' }}
                      >
                        <TableCell>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.supplier.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.supplier.email}
                          </p>
                        </TableCell>
                        <TableCell>{new Date(item.submittedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={getSemanticStatusStyle(statusSemantic[item.status])}
                          >
                            {formatStatusLabel(item.status)}
                          </Badge>
                          {item.rejectionReason ? (
                            <p
                              className="mt-1 max-w-56 truncate text-xs"
                              title={item.rejectionReason}
                              style={{ color: 'var(--state-error)' }}
                            >
                              {item.rejectionReason}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {item.pickedByAdmin ? (
                            <div>
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {item.pickedByAdmin.name}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {item.pickedByAdmin.email}
                              </p>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{getDecisionLabel(item)}</TableCell>
                        <TableCell className="text-right">{renderActions(item)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {!queueQuery.isLoading && items.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
              suppliers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(decisionTarget)}
        onOpenChange={(open) => {
          if (!open) closeDecisionDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionTarget?.action === 'verify' ? 'Verify supplier KYC' : 'Reject supplier KYC'}
            </DialogTitle>
            <DialogDescription>
              {decisionTarget?.action === 'verify'
                ? `Confirm that you reviewed the submitted documents for ${decisionTarget.supplierName}. Verification completes onboarding and notifies the supplier.`
                : `Explain why ${decisionTarget?.supplierName ?? 'this supplier'} did not pass verification. The reason is recorded and sent to the supplier.`}
            </DialogDescription>
          </DialogHeader>

          {decisionTarget?.action === 'reject' ? (
            <div className="space-y-2">
              <Label htmlFor="supplier-kyc-rejection-reason">Rejection reason</Label>
              <Textarea
                id="supplier-kyc-rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Describe what is missing or could not be verified"
                rows={4}
                maxLength={1000}
                disabled={isAnyActionPending}
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Minimum 3 characters · {rejectionReason.length}/1000
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={closeDecisionDialog} disabled={isAnyActionPending}>
              Cancel
            </Button>
            <Button
              variant={decisionTarget?.action === 'reject' ? 'destructive' : 'default'}
              onClick={handleDecision}
              disabled={
                isAnyActionPending ||
                (decisionTarget?.action === 'reject' && rejectionReason.trim().length < 3)
              }
            >
              {isAnyActionPending
                ? 'Saving…'
                : decisionTarget?.action === 'verify'
                  ? 'Confirm verification'
                  : 'Reject KYC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
