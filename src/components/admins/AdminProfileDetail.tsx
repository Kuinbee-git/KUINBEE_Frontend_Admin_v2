/**
 * AdminProfileDetail - Admin profile detail view with real API
 */
'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActionDialog } from '@/components/shared/ActionDialog';
import { AdminProfileSection } from '@/components/admins/AdminProfileSection';
import { AdminSecuritySection } from '@/components/admins/AdminSecuritySection';
import { AdminAuditSection } from '@/components/admins/AdminAuditSection';
import { AdminRolesSection } from '@/components/admins/AdminRolesSection';
import { DetailSkeleton } from '@/components/shared';
import {
  useAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
  useAdminRoles,
  useAdminRoleAudit,
} from '@/hooks';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

interface AdminProfileDetailProps {
  adminId: string;
  onBack?: () => void;
}

export function AdminProfileDetail({ adminId, onBack }: AdminProfileDetailProps) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useAdmin(adminId);
  const { can, isSuperadmin, user: currentUser } = useAuthorization();
  const canUpdateAdmin = can({ anyOf: [PERMISSIONS.ADMINS.UPDATE] });
  const canDeleteAdmin = can({ anyOf: [PERMISSIONS.ADMINS.DELETE] });
  const canAssignRoles = can({ anyOf: [PERMISSIONS.ROLES.ASSIGN] });
  const targetIsAdmin = data?.admin.userType === 'ADMIN';
  const targetIsSuperadmin = data?.admin.userType === 'SUPERADMIN';
  const canModifyTarget = !targetIsSuperadmin || isSuperadmin;
  const {
    data: rolesData,
    isLoading: assignedRolesLoading,
    isError: assignedRolesError,
    refetch: refetchAssignedRoles,
  } = useAdminRoles(adminId, {
    enabled: canAssignRoles && targetIsAdmin,
  });
  const {
    data: roleAuditData,
    isLoading: roleAuditLoading,
    isError: roleAuditError,
    refetch: refetchRoleAudit,
  } = useAdminRoleAudit(
    { adminId, page: 1, pageSize: 5, sort: 'createdAt:desc' },
    { enabled: isSuperadmin && targetIsAdmin }
  );
  const updateMutation = useUpdateAdmin();
  const deleteMutation = useDeleteAdmin();

  // State management
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Edit states - initialize from data immediately without useEffect
  const [editProfileData, setEditProfileData] = useState(() => ({
    employeeId: data?.adminProfile?.employeeId || '',
    department: data?.adminProfile?.department || '',
  }));

  // Memoized callbacks
  const handleEditProfileChange = useCallback((field: string, value: string) => {
    setEditProfileData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveProfile = useCallback(() => {
    updateMutation.mutate(
      {
        adminId,
        data: {
          adminProfile: {
            employeeId: editProfileData.employeeId || null,
            department: editProfileData.department || null,
          },
        },
      },
      {
        onSuccess: () => {
          setIsEditingProfile(false);
        },
      }
    );
  }, [adminId, editProfileData, updateMutation]);

  const handleCancelProfileEdit = useCallback(() => {
    if (data) {
      setEditProfileData({
        employeeId: data.adminProfile?.employeeId || '',
        department: data.adminProfile?.department || '',
      });
    }
    setIsEditingProfile(false);
  }, [data]);

  const handleToggleEdit = useCallback(() => {
    if (!isEditingProfile && data) {
      setEditProfileData({
        employeeId: data.adminProfile?.employeeId || '',
        department: data.adminProfile?.department || '',
      });
    }
    setIsEditingProfile((prev) => !prev);
  }, [data, isEditingProfile]);

  // Handle enforcement actions
  const handleSuspend = useCallback(() => {
    if (!canUpdateAdmin || !canModifyTarget || currentUser?.id === adminId) return;
    updateMutation.mutate(
      {
        adminId,
        data: { status: 'SUSPENDED', reason: suspendReason.trim() },
      },
      {
        onSuccess: () => {
          setSuspendDialogOpen(false);
          setSuspendReason('');
        },
      }
    );
  }, [adminId, canModifyTarget, canUpdateAdmin, currentUser?.id, suspendReason, updateMutation]);

  const handleDelete = useCallback(() => {
    if (!canDeleteAdmin || !canModifyTarget || currentUser?.id === adminId) return;
    deleteMutation.mutate(
      { adminId, data: { reason: deleteReason.trim() } },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeleteReason('');
          if (onBack) {
            onBack();
          } else {
            router.push('/dashboard/admins');
          }
        },
      }
    );
  }, [
    adminId,
    canDeleteAdmin,
    canModifyTarget,
    currentUser?.id,
    deleteMutation,
    deleteReason,
    onBack,
    router,
  ]);

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <p className="font-medium text-[var(--status-error)]">Failed to load admin details</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {getFriendlyErrorMessage(error)}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-4 sm:p-6">
        <DetailSkeleton />
      </div>
    );
  }

  const adminName = data.admin.email.split('@')[0] || data.admin.email;
  const isSelf = currentUser?.id === data.admin.id;
  const canSuspend = data.admin.status === 'ACTIVE' && canUpdateAdmin && canModifyTarget && !isSelf;
  const canDelete = canDeleteAdmin && canModifyTarget && !isSelf;
  const canEditProfile = canUpdateAdmin && canModifyTarget;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div
        className="border-b p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {adminName}
              </h1>
              <p className="break-all" style={{ color: 'var(--text-muted)' }}>
                {data.admin.email}
              </p>
            </div>
          </div>

          {/* Enforcement Actions */}
          {(canSuspend || canDelete) && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {canSuspend && (
                <Button
                  variant="outline"
                  onClick={() => setSuspendDialogOpen(true)}
                  disabled={updateMutation.isPending}
                  style={{
                    borderColor: 'var(--status-warning)',
                    color: 'var(--status-warning)',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Suspend Admin
                </Button>
              )}
              {canDelete ? (
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleteMutation.isPending}
                  style={{
                    borderColor: 'var(--status-error)',
                    color: 'var(--status-error)',
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Admin
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4 sm:p-6">
        {/* Profile & Employment */}
        <AdminProfileSection
          admin={data}
          isEditing={isEditingProfile}
          onToggleEdit={handleToggleEdit}
          onSave={handleSaveProfile}
          onCancel={handleCancelProfileEdit}
          editData={editProfileData}
          onEditChange={handleEditProfileChange}
          canEdit={canEditProfile}
          isSaving={updateMutation.isPending}
        />

        {/* Security State */}
        <AdminSecuritySection admin={data} />

        {/* Roles Section */}
        {canAssignRoles && targetIsAdmin && assignedRolesLoading ? (
          <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading assigned roles...
            </p>
          </div>
        ) : canAssignRoles && targetIsAdmin && assignedRolesError ? (
          <div
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error)',
            }}
          >
            <span className="text-sm">Assigned roles could not be loaded.</span>
            <Button variant="outline" size="sm" onClick={() => refetchAssignedRoles()}>
              Retry
            </Button>
          </div>
        ) : canAssignRoles && targetIsAdmin ? (
          <AdminRolesSection adminId={adminId} currentRoles={rolesData?.roles || []} />
        ) : null}

        {isSuperadmin && targetIsAdmin && roleAuditLoading ? (
          <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading role assignment activity...
            </p>
          </div>
        ) : isSuperadmin && targetIsAdmin && roleAuditError ? (
          <div
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error)',
            }}
          >
            <span className="text-sm">Role assignment activity could not be loaded.</span>
            <Button variant="outline" size="sm" onClick={() => refetchRoleAudit()}>
              Retry
            </Button>
          </div>
        ) : isSuperadmin && targetIsAdmin ? (
          <AdminAuditSection auditLogs={roleAuditData?.items || []} />
        ) : null}
      </div>

      {/* Dialogs */}
      <ActionDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        action="suspend"
        subjectLabel="admin"
        targetName={adminName}
        reason={suspendReason}
        onReasonChange={setSuspendReason}
        onConfirm={handleSuspend}
        onCancel={() => setSuspendDialogOpen(false)}
      />

      <ActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        action="delete"
        subjectLabel="admin"
        targetName={adminName}
        reason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
