/**
 * AdminTable - Admin list table using generic DataTable
 * Uses new AdminListItem type with personalInfo structure
 */
'use client';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getAdminStatusInfo, getAdminTypeLabel } from '@/utils/admin.utils';
import type { AdminListItem } from '@/types/admin.types';

interface AdminTableProps {
  admins: AdminListItem[];
  onRowClick?: (adminId: string) => void;
}

// Helper to get display name from AdminListItem
function getDisplayName(admin: AdminListItem): string {
  if (admin.personalInfo) {
    return (
      admin.personalInfo.fullName?.trim() ||
      `${admin.personalInfo.firstName} ${admin.personalInfo.lastName}`.trim()
    );
  }
  return admin.email;
}

// Helper to format last login
function formatLastLogin(date: string | null): string {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function AdminTable({ admins, onRowClick }: AdminTableProps) {
  const columns: ColumnDef<AdminListItem>[] = [
    {
      header: 'Name',
      render: (admin) => (
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {getDisplayName(admin)}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {admin.email}
          </p>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (admin) => (
        <span style={{ color: 'var(--text-primary)' }}>{getAdminTypeLabel(admin.userType)}</span>
      ),
    },
    {
      header: 'Status',
      render: (admin) => {
        const statusInfo = getAdminStatusInfo(admin.status);
        const semanticType: 'success' | 'error' | 'neutral' | 'warning' =
          statusInfo.variant === 'success'
            ? 'success'
            : statusInfo.variant === 'error'
              ? 'error'
              : statusInfo.variant === 'warning'
                ? 'warning'
                : 'neutral';
        return <StatusBadge status={statusInfo.label} semanticType={semanticType} />;
      },
    },
    {
      header: 'Department',
      render: (admin) => (
        <span style={{ color: 'var(--text-primary)' }}>
          {admin.adminProfile?.department || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Last Active',
      render: (admin) => (
        <span style={{ color: 'var(--text-muted)' }}>{formatLastLogin(admin.lastLoginAt)}</span>
      ),
    },
    {
      header: 'Employee ID',
      render: (admin) => (
        <span style={{ color: 'var(--text-muted)' }}>
          {admin.adminProfile?.employeeId || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Roles',
      render: (admin) => (
        <span style={{ color: 'var(--text-primary)' }}>
          {admin.roles && admin.roles.length > 0
            ? admin.roles.map((role) => role.displayName).join(', ')
            : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={admins}
      onRowClick={onRowClick ? (admin) => onRowClick(admin.id) : undefined}
      getRowKey={(admin) => admin.id}
      ariaLabel="Administrators"
      getRowLabel={(admin) => `Open administrator ${admin.email}`}
    />
  );
}
