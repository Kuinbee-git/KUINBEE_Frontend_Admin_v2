"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteFilters } from "./InviteFilters";
import { InviteTable } from "./InviteTable";
import { CreateInviteDialog, ResendInviteDialog, CancelInviteDialog } from "./InviteDialogs";
import { InviteDetailDialog } from "./InviteDetailDialog";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useInvites, useCreateInvite, useResendInvite, useCancelInvite, useRoles, useMyPermissions } from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import type { Invite, InviteStatus } from "@/types";

export function InvitesView() {
  // Hydration fix: only render after mount
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InviteStatus | "all">("all");

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Build API params
  const params = useMemo(() => ({
    page,
    pageSize: limit,
    q: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }), [page, limit, debouncedSearch, statusFilter]);

  // Fetch invites
  const { data, isLoading, isError } = useInvites(params);
  const invites = data?.items || [];
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / data.pagination.pageSize) : 0;

  // Fetch roles for create dialog
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const roles = rolesData?.items || [];

  // Permissions
  const { data: permissionsData } = useMyPermissions();
  const canManageInvites = permissionsData?.includes('CREATE_ADMIN') || permissionsData?.includes('MANAGE_PERMISSIONS') || false;

  // Mutations
  const createMutation = useCreateInvite();
  const resendMutation = useResendInvite();
  const cancelMutation = useCancelInvite();

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
  }, []);

  const handleCreateInvite = useCallback((data: { email: string; roleIds: string[]; expiresInHours: number; sendEmail: boolean }) => {
    createMutation.mutate(
      { email: data.email, roleIds: data.roleIds, expiresInHours: data.expiresInHours, sendEmail: data.sendEmail },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
        },
      }
    );
  }, [createMutation]);

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

  if (!mounted) return null;
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Admin Invites
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Invite and manage new admin users with role assignments
            </p>
          </div>
          {canManageInvites && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
            >
              <Plus className="w-4 h-4" />
              Invite Admin
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <InviteFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      <div className="p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Failed to load invites. Please try again.</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                No invites found
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {debouncedSearch || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by inviting your first admin"}
              </p>
              {(debouncedSearch || statusFilter !== "all") && (
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
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} invites
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
      <CreateInviteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateInvite}
        isLoading={createMutation.isPending}
        roles={roles}
        rolesLoading={rolesLoading}
      />

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
