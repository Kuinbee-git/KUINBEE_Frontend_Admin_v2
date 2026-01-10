/**
 * UserTable - Refactored table using generic DataTable component
 */

"use client";

import React from 'react';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
      render: (email: string, row: UserListItem) => (
        <div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {email}
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
      render: (userType: string) => (
        <Badge
          variant="outline"
          className="text-xs"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#a78bfa',
            borderColor: 'rgba(139, 92, 246, 0.3)',
          }}
        >
          {userType}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status: UserListItem['status']) => (
        <StatusBadge
          status={USER_STATUS_LABELS[status]}
          semanticType={getUserStatusSemantic(status)}
        />
      ),
    },
    {
      header: 'Email Verified',
      accessor: 'emailVerified',
      align: 'center',
      render: (verified: boolean) =>
        verified ? (
          <span className="text-lg" style={{ color: 'var(--state-success)' }}>
            ✓
          </span>
        ) : (
          <span className="text-lg" style={{ color: 'var(--text-disabled)' }}>
            ✗
          </span>
        ),
    },
    {
      header: 'Datasets Accessed',
      accessor: 'datasetsAccessed',
      align: 'center',
      render: (count: number) => (
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {count}
        </span>
      ),
    },
    {
      header: 'Orders',
      accessor: 'orders',
      align: 'center',
      render: (count: number) => (
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {count}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessor: 'lastLoginAt',
      render: (date: string | null) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(date)}
        </span>
      ),
    },
    {
      header: 'Joined On',
      accessor: 'createdAt',
      render: (date: string) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(date)}
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
      emptyMessage="No users found"
    />
  );
}
