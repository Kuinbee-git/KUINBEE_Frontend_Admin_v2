/**
 * AdminsListView - Admin list using real API data
 */
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AdminTable } from '@/components/admins/AdminTable';
import { AdminFilters } from '@/components/admins/AdminFilters';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAdmins } from '@/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import type { AdminListItem } from '@/types/admin.types';

interface AdminsListViewProps {
  onAdminClick?: (adminId: string) => void;
  onBack?: () => void;
}

export function AdminsListView({ onAdminClick, onBack }: AdminsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Build API params
  const params = useMemo(
    () => ({
      page,
      pageSize: limit,
      q: debouncedSearch || undefined,
      status: (statusFilter !== 'all' ? statusFilter : 'ALL') as
        | 'ALL'
        | 'ACTIVE'
        | 'INACTIVE'
        | 'SUSPENDED'
        | 'PENDING_VERIFICATION'
        | 'DELETED',
      userType: (typeFilter !== 'all' ? typeFilter : 'ALL') as 'ALL' | 'ADMIN' | 'SUPERADMIN',
      sort: 'createdAt:desc' as const,
    }),
    [page, limit, debouncedSearch, statusFilter, typeFilter]
  );

  // Fetch admins
  const { data, isLoading, isError, refetch } = useAdmins(params);

  // Convert API response to AdminListItem format for UI
  const admins: AdminListItem[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => ({
      id: item.admin.id,
      email: item.admin.email,
      phone: item.admin.phone,
      userType: item.admin.userType,
      status: item.admin.status,
      emailVerified: item.admin.emailVerified,
      createdAt: item.admin.createdAt,
      updatedAt: item.admin.updatedAt,
      lastLoginAt: item.admin.lastLoginAt,
      deletedAt: item.admin.deletedAt,
      personalInfo: item.personalInfo,
      adminProfile: item.adminProfile,
      roles: item.roles || [],
    }));
  }, [data]);

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPage(1);
  };

  const totalPages = data?.pagination
    ? Math.ceil(data.pagination.total / data.pagination.pageSize)
    : 0;

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--status-error)]">Failed to load admins. Please try again.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader
        title="Admins"
        description={`${data?.pagination.total ?? 0} admin${data?.pagination.total === 1 ? '' : 's'} found`}
        onBack={onBack}
        backLabel="Back from admins"
      />

      {/* Filter Bar */}
      <AdminFilters
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        typeFilter={typeFilter}
        setTypeFilter={(value) => {
          setTypeFilter(value);
          setPage(1);
        }}
        onClearAll={handleClearAll}
      />

      {/* Admin Table */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <TableSkeleton rows={10} columns={6} />
        ) : !data || !Array.isArray(data.items) || admins.length === 0 ? (
          <div
            className="p-12 text-center border rounded-lg"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No admins found
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'There are no admins in the system yet.'}
            </p>
          </div>
        ) : (
          <>
            <div
              className="rounded-lg border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-default)',
              }}
            >
              <AdminTable admins={admins} onRowClick={onAdminClick} />
            </div>

            {/* Pagination */}
            {data && data.pagination && totalPages > 1 && (
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} admins
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
                    disabled={page >= totalPages}
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
