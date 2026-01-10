'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserFilters } from '@/components/users/UserFilters';
import { UserTable } from '@/components/users/UserTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUsers } from '@/hooks';
import { TableSkeleton } from '@/components/shared';
import { useDebounce } from '@/hooks/useDebounce';

export function UsersListView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');
  const [hasDatasetAccessFilter, setHasDatasetAccessFilter] = useState('all');

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Reset page to 1 when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusFilter, emailVerifiedFilter, hasDatasetAccessFilter]);

  // Build filters for API
  const filters = useMemo(() => {
    const params: Record<string, string> = {};
    if (debouncedSearchQuery) params.search = debouncedSearchQuery;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (emailVerifiedFilter !== 'all') params.emailVerified = emailVerifiedFilter;
    if (hasDatasetAccessFilter !== 'all') params.hasDatasetAccess = hasDatasetAccessFilter;
    return params;
  }, [debouncedSearchQuery, statusFilter, emailVerifiedFilter, hasDatasetAccessFilter]);

  // Fetch users with React Query
  const { data, isLoading, isError } = useUsers({ page, limit, ...filters });

  const handleRowClick = useCallback((userId: string) => {
    router.push(`/dashboard/users/${userId}`);
  }, [router]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setEmailVerifiedFilter('all');
    setHasDatasetAccessFilter('all');
    setPage(1);
  }, []);

  const activeFilters = useMemo(() => [
    statusFilter !== 'all' && {
      key: 'status',
      label: `Status: ${statusFilter}`,
      onRemove: () => setStatusFilter('all'),
    },
    emailVerifiedFilter !== 'all' && {
      key: 'emailVerified',
      label: `Email: ${emailVerifiedFilter === 'true' ? 'Verified' : 'Unverified'}`,
      onRemove: () => setEmailVerifiedFilter('all'),
    },
    hasDatasetAccessFilter !== 'all' && {
      key: 'hasDatasetAccess',
      label: `Access: ${hasDatasetAccessFilter === 'true' ? 'Has Access' : 'No Access'}`,
      onRemove: () => setHasDatasetAccessFilter('all'),
    },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[], [statusFilter, emailVerifiedFilter, hasDatasetAccessFilter]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load users. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Users
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage marketplace users and their access
          </p>
        </div>
        <Button
          className="gap-2"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: '#ffffff',
          }}
        >
          <Plus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Filters */}
      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        emailVerifiedFilter={emailVerifiedFilter}
        onEmailVerifiedChange={setEmailVerifiedFilter}
        hasDatasetAccessFilter={hasDatasetAccessFilter}
        onHasDatasetAccessChange={setHasDatasetAccessFilter}
        activeFilters={activeFilters}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : !data || !Array.isArray(data.items) || data.items.length === 0 ? (
        <div className="p-12 text-center border rounded-lg" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            No users found
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {activeFilters.length > 0
              ? 'Try adjusting your filters to see more results.'
              : 'There are no users in the system yet.'}
          </p>
          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <UserTable users={data.items} onUserClick={handleRowClick} />

          {/* Pagination */}
          {data && data.pagination && data.pagination.pageSize > 0 && Math.ceil(data.pagination.total / data.pagination.pageSize) > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, data.pagination.total)} of{' '}
                {data.pagination.total} users
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
  );
}