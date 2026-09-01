'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserFilters } from '@/components/users/UserFilters';
import { UserTable } from '@/components/users/UserTable';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks';
import { TableSkeleton } from '@/components/shared';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDebounce } from '@/hooks/useDebounce';
import { formatStatusLabel } from '@/components/shared/StatusBadge';

export function UsersListView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Build filters for API
  const filters = useMemo(() => {
    const params: {
      q?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';
      emailVerified?: boolean;
    } = {};
    if (debouncedSearchQuery) params.q = debouncedSearchQuery;
    if (statusFilter !== 'all') params.status = statusFilter as typeof params.status;
    if (emailVerifiedFilter !== 'all') params.emailVerified = emailVerifiedFilter === 'true';
    return params;
  }, [debouncedSearchQuery, statusFilter, emailVerifiedFilter]);

  // Fetch users with React Query
  const { data, isLoading, isError, refetch } = useUsers({
    page,
    pageSize: limit,
    userType: 'USER',
    ...filters,
  });

  const handleRowClick = useCallback(
    (userId: string) => {
      router.push(`/dashboard/users/${userId}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setEmailVerifiedFilter('all');
    setPage(1);
  }, []);

  const activeFilters = useMemo(
    () =>
      [
        statusFilter !== 'all' && {
          key: 'status',
          label: `Status: ${formatStatusLabel(statusFilter)}`,
          onRemove: () => {
            setStatusFilter('all');
            setPage(1);
          },
        },
        emailVerifiedFilter !== 'all' && {
          key: 'emailVerified',
          label: `Email: ${emailVerifiedFilter === 'true' ? 'Verified' : 'Unverified'}`,
          onRemove: () => {
            setEmailVerifiedFilter('all');
            setPage(1);
          },
        },
      ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[],
    [statusFilter, emailVerifiedFilter]
  );

  if (isError) {
    return (
      <div className="p-4 text-center sm:p-8">
        <p className="text-[var(--status-error)]">Failed to load users. Please try again.</p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader title="Users" description="Manage marketplace users and their access" />

      <div className="space-y-6 p-4 sm:p-6">
        <UserFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          emailVerifiedFilter={emailVerifiedFilter}
          onEmailVerifiedChange={(value) => {
            setEmailVerifiedFilter(value);
            setPage(1);
          }}
          activeFilters={activeFilters}
          onClearAll={handleClearFilters}
        />

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={10} columns={6} />
        ) : !data || !Array.isArray(data.items) || data.items.length === 0 ? (
          <div
            className="p-12 text-center border rounded-lg"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No users found
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {activeFilters.length > 0
                ? 'Try adjusting your filters to see more results.'
                : 'There are no users in the system yet.'}
            </p>
            {activeFilters.length > 0 && (
              <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <UserTable users={data.items} onUserClick={handleRowClick} />

            {/* Pagination */}
            {data &&
              data.pagination &&
              data.pagination.pageSize > 0 &&
              Math.ceil(data.pagination.total / data.pagination.pageSize) > 1 && (
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(data.pagination.total / data.pagination.pageSize)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
