/**
 * AdminsListView - Admin list using real API data
 */
"use client";
import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminTable } from '@/components/admins/AdminTable';
import { AdminFilters } from '@/components/admins/AdminFilters';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
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
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Compute page based on filter changes (resets to 1 when filters change)
  const filterKey = `${debouncedSearch}-${statusFilter}-${typeFilter}-${departmentFilter}`;
  const [currentFilterKey, setCurrentFilterKey] = useState(filterKey);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Reset page when filters change
  if (filterKey !== currentFilterKey) {
    setCurrentFilterKey(filterKey);
    setPage(1);
  }

  // Build API params

  // Build API params
  const params = useMemo(() => ({
    page,
    pageSize: limit,
    q: debouncedSearch || undefined,
    status: (statusFilter !== 'all' ? statusFilter : 'ALL') as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED',
    sort: 'createdAt:desc',
  }), [page, limit, debouncedSearch, statusFilter]);

  // Fetch admins
  const { data, isLoading, isError } = useAdmins(params);

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
      personalInfo: null, // Not available in list response
      adminProfile: item.adminProfile,
    }));
  }, [data]);

  // Apply client-side filters (type and department not in API)
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      // Type filter
      if (typeFilter !== 'all' && admin.userType !== typeFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && admin.adminProfile?.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [admins, typeFilter, departmentFilter]);

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDepartmentFilter('all');
    setPage(1);
  };

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / data.pagination.pageSize) : 0;

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load admins. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Page Header */}
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
                Admins
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <Button
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
            }}
          >
            Create Admin
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <AdminFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        onClearAll={handleClearAll}
      />

      {/* Admin Table */}
      <div className="p-6">
        {isLoading ? (
          <TableSkeleton rows={10} columns={6} />
        ) : !data || !Array.isArray(data.items) || filteredAdmins.length === 0 ? (
          <div className="p-12 text-center border rounded-lg" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No admins found
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || departmentFilter !== 'all'
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
              <AdminTable admins={filteredAdmins} onRowClick={onAdminClick} />
            </div>

            {/* Pagination */}
            {data && data.pagination && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, data.pagination.total)} of{' '}
                  {data.pagination.total} admins
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
