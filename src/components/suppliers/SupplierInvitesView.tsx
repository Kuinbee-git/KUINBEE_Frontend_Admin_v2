'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SupplierInvitesTable } from './SupplierInvitesTable';
import { InviteSupplierDialog } from './InviteSupplierDialog';
import { useSupplierInvites, useResendSupplierInvite } from '@/hooks/api/useSupplierInvites';
import type { SupplierInvite } from '@/types';

export function SupplierInvitesView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const query = useSupplierInvites({ page, pageSize, sort: 'createdAt:desc' });
  const resendMutation = useResendSupplierInvite();

  const handleResend = (invite: SupplierInvite) => {
    resendMutation.mutate(invite.id);
  };

  const invites = query.data?.items || [];
  const total = query.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Card style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: 'var(--text-primary)' }}>Supplier Invites</CardTitle>
              <CardDescription style={{ color: 'var(--text-muted)' }}>
                Manage and send supplier invitation emails
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Mail className="w-4 h-4" />
              Invite Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              Loading invites...
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center">
              <p className="font-medium">Could not load supplier invites</p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No invites sent yet. Click &quot;Invite Supplier&quot; to send your first invite.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <SupplierInvitesTable
                invites={invites}
                onResend={handleResend}
                resendingInviteId={resendMutation.isPending ? resendMutation.variables : undefined}
              />
            </div>
          )}

          {!query.isLoading && !query.isError && total > 0 ? (
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}{' '}
                invites
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || query.isFetching}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <InviteSupplierDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
