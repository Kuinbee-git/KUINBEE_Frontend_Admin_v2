/**
 * AdminProfileDetail - Admin profile detail view with real API
 */
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActionDialog } from '@/components/shared/ActionDialog';
import { AdminProfileSection } from '@/components/admins/AdminProfileSection';
import { AdminSecuritySection } from '@/components/admins/AdminSecuritySection';
import { AdminAuditSection } from '@/components/admins/AdminAuditSection';
import { AdminRolesSection } from '@/components/admins/AdminRolesSection';
import { DetailSkeleton } from '@/components/shared';
import { useAdmin, useUpdateAdmin, useDeleteAdmin, useAdminRoles } from '@/hooks';

interface AdminProfileDetailProps {
  adminId: string;
  onBack?: () => void;
}

export function AdminProfileDetail({ adminId, onBack }: AdminProfileDetailProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useAdmin(adminId);
  const { data: rolesData } = useAdminRoles(adminId);
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

  // Update edit data when admin data loads
  useEffect(() => {
    if (data && data.admin?.id) {
      setEditProfileData({
        employeeId: data.adminProfile?.employeeId || '',
        department: data.adminProfile?.department || '',
      });
    }
  }, [data]);

  // Memoized callbacks
  const handleEditProfileChange = useCallback((field: string, value: string) => {
    setEditProfileData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveProfile = useCallback(() => {
    updateMutation.mutate(
      {
        adminId,
        data: {
          adminProfile: {
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
    setIsEditingProfile(prev => !prev);
  }, []);

  // Handle enforcement actions
  const handleSuspend = useCallback(() => {
    updateMutation.mutate(
      {
        adminId,
        data: { status: 'SUSPENDED' },
      },
      {
        onSuccess: () => {
          setSuspendDialogOpen(false);
          setSuspendReason('');
        },
      }
    );
  }, [adminId, updateMutation]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate(adminId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeleteReason('');
        if (onBack) {
          onBack();
        } else {
          router.push('/dashboard/admins');
        }
      },
    });
  }, [adminId, deleteMutation, onBack, router]);

  if (isError) {
    return (
      <div className="p-6">
        <p style={{ color: 'var(--text-muted)' }}>Failed to load admin details</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <DetailSkeleton />
      </div>
    );
  }

  const adminName = data.admin.email.split('@')[0];
  const canSuspend = data.admin.status === 'ACTIVE';
  const isSelf = false; // TODO: Compare with current user ID from auth

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {adminName}
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>{data.admin.email}</p>
            </div>
          </div>

          {/* Enforcement Actions */}
          {!isSelf && (
            <div className="flex gap-2">
              {canSuspend && (
                <Button
                  variant="outline"
                  onClick={() => setSuspendDialogOpen(true)}
                  disabled={updateMutation.isPending}
                  style={{
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Suspend Admin
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
                style={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Admin
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Profile & Employment */}
        <AdminProfileSection
          admin={data}
          isEditing={isEditingProfile}
          onToggleEdit={handleToggleEdit}
          onSave={handleSaveProfile}
          onCancel={handleCancelProfileEdit}
          editData={editProfileData}
          onEditChange={handleEditProfileChange}
        />

        {/* Security State */}
        <AdminSecuritySection admin={data} />

        {/* Roles Section */}
        <AdminRolesSection
          adminId={adminId}
          currentRoles={rolesData?.roles || []}
        />

        {/* Audit Awareness - Mock for now */}
        <AdminAuditSection
          auditLogs={[]}
          lastPermissionChange={data.admin.updatedAt}
          permissionChangedBy="System"
        />
      </div>

      {/* Dialogs */}
      <ActionDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        action="suspend"
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
        targetName={adminName}
        reason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
