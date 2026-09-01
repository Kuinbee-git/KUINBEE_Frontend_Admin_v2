/**
 * UserTable - Refactored table using generic DataTable component
 */

'use client';

import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { formatEnumLabel, StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { UserListItem } from '@/types/user.types';
import { getUserStatusSemantic } from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';
import { USER_STATUS_LABELS } from '@/constants/user.constants';

interface UserTableProps {
  users: UserListItem[];
  onUserClick?: (userId: string) => void;
}

export function UserTable({ users, onUserClick }: UserTableProps) {
  const columns: ColumnDef<UserListItem>[] = [
    {
      header: 'User',
      accessor: 'email',
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {row.personalInfo?.fullName?.trim() ||
              [row.personalInfo?.firstName, row.personalInfo?.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() ||
              row.email}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {row.email}
          </p>
          {row.organization && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {row.organization}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'User Type',
      accessor: 'userType',
      render: (row) => (
        <Badge
          variant="outline"
          className="text-xs"
          style={{
            backgroundColor: 'var(--status-in-progress-bg)',
            color: 'var(--status-in-progress)',
            borderColor: 'var(--status-in-progress-border)',
          }}
        >
          {formatEnumLabel(row.userType)}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <StatusBadge
          status={USER_STATUS_LABELS[row.status]}
          semanticType={getUserStatusSemantic(row.status)}
        />
      ),
    },
    {
      header: 'Email Verified',
      accessor: 'emailVerified',
      align: 'center',
      render: (row) =>
        row.emailVerified ? (
          <span className="text-lg" style={{ color: 'var(--state-success)' }}>
            <span className="sr-only">Verified</span>✓
          </span>
        ) : (
          <span className="text-lg" style={{ color: 'var(--text-disabled)' }}>
            <span className="sr-only">Not verified</span>✗
          </span>
        ),
    },
    {
      header: 'Last Login',
      accessor: 'lastLoginAt',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(row.lastLoginAt)}
        </span>
      ),
    },
    {
      header: 'Joined On',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      getRowKey={(user) => user.id}
      onRowClick={(user) => onUserClick?.(user.id)}
      ariaLabel="Users"
      getRowLabel={(user) => `Open user ${user.email}`}
      emptyMessage="No users found"
    />
  );
}
