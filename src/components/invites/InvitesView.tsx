'use client';

import { useState, useMemo, useCallback } from 'react';

import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InviteFilters } from './InviteFilters';
import { InviteTable } from './InviteTable';
import { CreateInviteDialog, ResendInviteDialog, CancelInviteDialog } from './InviteDialogs';
import { InviteDetailDialog } from './InviteDetailDialog';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { useInvites, useCreateInvite, useResendInvite, useCancelInvite, useRoles } from '@/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import type { Invite, InviteStatus } from '@/types';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';

export function InvitesView() {
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InviteStatus | 'all'>('all');

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Build API params
  const params = useMemo(
    () => ({
      page,
      pageSize: limit,
      q: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [page, limit, debouncedSearch, statusFilter]
  );

  // Fetch invites
  const { data, isLoading, isError, refetch } = useInvites(params);
  const invites = data?.items || [];
  const totalPages = data?.pagination
    ? Math.ceil(data.pagination.total / data.pagination.pageSize)
    : 0;

  // Fetch roles for create dialog
  const {
    data: rolesData,
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useRoles();
  const roles = rolesData?.items || [];

  // Permissions
  const { can } = useAuthorization();
  const canManageInvites = can({ anyOf: [PERMISSIONS.ADMINS.CREATE] });

  // Mutations
  const createMutation = useCreateInvite();
  const resendMutation = useResendInvite();
  const cancelMutation = useCancelInvite();

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  }, []);

  const handleCreateInvite = useCallback(
    (data: { email: string; roleIds: string[]; expiresInHours: number; sendEmail: boolean }) => {
      createMutation.mutate(
        {
          email: data.email,
          roleIds: data.roleIds,
          expiresInHours: data.expiresInHours,
          sendEmail: data.sendEmail,
        },
        {
          onSuccess: () => {
            setCreateDialogOpen(false);
          },
        }
      );
    },
    [createMutation]
  );

  const handleResendClick = useCallback((invite: Invite) => {
    setSelectedInvite(invite);
    setResendDialogOpen(true);
  }, []);

  const handleResendConfirm = useCallback(() => {
    if (!selectedInvite) return;
    resendMutation.mutate(selectedInvite.id, {
      onSuccess: () => {
        setResendDialogOpen(false);
        setSelectedInvite(null);
      },
    });
  }, [selectedInvite, resendMutation]);

  const handleCancelClick = useCallback((invite: Invite) => {
    setSelectedInvite(invite);
    setCancelDialogOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (!selectedInvite) return;
    cancelMutation.mutate(selectedInvite.id, {
      onSuccess: () => {
        setCancelDialogOpen(false);
        setSelectedInvite(null);
      },
    });
  }, [selectedInvite, cancelMutation]);

  const handleViewDetails = useCallback((invite: Invite) => {
    setSelectedInvite(invite);
    setDetailDialogOpen(true);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader
        title="Admin Invites"
        description="Invite and manage new admin users with role assignments"
        actions={
          canManageInvites ? (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2"
              disabled={rolesError}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Invite Admin
            </Button>
          ) : undefined
        }
      />

      {canManageInvites && rolesError ? (
        <div className="px-4 pt-4 sm:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Role catalog unavailable</AlertTitle>
            <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <span>Admin invitations are disabled until roles can be loaded.</span>
              <Button size="sm" variant="outline" onClick={() => refetchRoles()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Filters */}
      <InviteFilters
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      <div className="p-4 sm:p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">
                Failed to load invites. Please try again.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : invites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No invites found
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {debouncedSearch || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by inviting your first admin'}
              </p>
              {(debouncedSearch || statusFilter !== 'all') && (
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <InviteTable
              invites={invites}
              onResend={handleResendClick}
              onCancel={handleCancelClick}
              onViewDetails={handleViewDetails}
              canManageInvites={canManageInvites}
            />
          )}
        </div>

        {/* Pagination */}
        {!isLoading && invites.length > 0 && data?.pagination && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of{' '}
              {data.pagination.total} invites
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {createDialogOpen && (
        <CreateInviteDialog
          open
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateInvite}
          isLoading={createMutation.isPending}
          roles={roles}
          rolesLoading={rolesLoading}
        />
      )}

      <ResendInviteDialog
        open={resendDialogOpen}
        onOpenChange={setResendDialogOpen}
        onConfirm={handleResendConfirm}
        isLoading={resendMutation.isPending}
        invite={selectedInvite}
      />

      <CancelInviteDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        isLoading={cancelMutation.isPending}
        invite={selectedInvite}
      />

      <InviteDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        invite={selectedInvite}
        onResend={handleResendClick}
        onCancel={handleCancelClick}
        canManageInvites={canManageInvites}
      />
    </div>
  );
}
