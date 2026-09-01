'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Calendar, ShieldAlert, Trash2 } from 'lucide-react';
import { formatEnumLabel, StatusBadge } from '@/components/shared/StatusBadge';
import { useUser, useSuspendUser, useUnsuspendUser, useDeleteUser } from '@/hooks';
import { DetailSkeleton } from '@/components/shared';
import { ActionDialog, type ActionType } from '@/components/shared/ActionDialog';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { useState } from 'react';

interface UserDetailViewProps {
  userId: string;
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useUser(userId);
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const deleteMutation = useDeleteUser();
  const { can } = useAuthorization();
  const canSuspend = can({ anyOf: [PERMISSIONS.USERS.SUSPEND] });
  const canDelete = can({ anyOf: [PERMISSIONS.USERS.DELETE] });
  const [action, setAction] = useState<ActionType | null>(null);
  const [reason, setReason] = useState('');

  const user = data?.user;
  const displayName =
    data?.personalInfo?.fullName?.trim() ||
    [data?.personalInfo?.firstName, data?.personalInfo?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user?.email;

  const closeAction = () => {
    setAction(null);
    setReason('');
  };

  const handleConfirmAction = async () => {
    const actionReason = reason.trim();
    if (!action || !actionReason) return;

    try {
      if (action === 'suspend') {
        await suspendMutation.mutateAsync({ userId, data: { reason: actionReason } });
      } else if (action === 'activate') {
        await unsuspendMutation.mutateAsync({ userId, data: { reason: actionReason } });
      } else {
        await deleteMutation.mutateAsync({ userId, data: { reason: actionReason } });
        router.push('/dashboard/users');
      }
      closeAction();
    } catch {
      // Mutation hooks surface the API error.
    }
  };

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-lg py-12 text-center">
          <p className="font-medium text-[var(--status-error)]">Could not load user details</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {getFriendlyErrorMessage(error)}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </h1>
            <StatusBadge
              status={formatEnumLabel(user.status)}
              semanticType={
                user.status === 'ACTIVE'
                  ? 'success'
                  : user.status === 'SUSPENDED'
                    ? 'error'
                    : user.status === 'PENDING_VERIFICATION'
                      ? 'pending'
                      : 'neutral'
              }
            />
            {user.emailVerified && (
              <Badge
                variant="outline"
                className="border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]"
              >
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {user.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canSuspend && user.status !== 'DELETED' ? (
            <Button
              variant="outline"
              onClick={() => setAction(user.status === 'SUSPENDED' ? 'activate' : 'suspend')}
              disabled={suspendMutation.isPending || unsuspendMutation.isPending}
              className="gap-2"
            >
              <ShieldAlert className="h-4 w-4" />
              {user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
            </Button>
          ) : null}
          {canDelete && user.status !== 'DELETED' ? (
            <Button
              variant="destructive"
              onClick={() => setAction('delete')}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {/* Basic Information */}
      <div
        className="border rounded-lg p-6 space-y-4"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Basic Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Email
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {user.email}
              </p>
            </div>
          </div>
          {user.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Phone
                </p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {user.phone}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Joined
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-1" style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Last Updated
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div
        className="border rounded-lg p-6 space-y-4"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Account Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              User Type
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatEnumLabel(user.userType)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Email Verified
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
              {user.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Organization (if exists) */}
      {data?.personalInfo?.firstName && (
        <div
          className="border rounded-lg p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Personal Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Name
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {data.personalInfo.firstName} {data.personalInfo.lastName}
              </p>
            </div>
          </div>
        </div>
      )}
      {action ? (
        <ActionDialog
          open
          onOpenChange={(open) => !open && closeAction()}
          action={action}
          targetName={displayName || user.email}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={handleConfirmAction}
          onCancel={closeAction}
        />
      ) : null}
    </div>
  );
}
