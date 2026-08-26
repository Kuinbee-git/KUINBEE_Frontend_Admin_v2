'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgePercent, RefreshCw } from 'lucide-react';

import { FilterBar, type ActiveFilter, type FilterConfig } from '@/components/shared/FilterBar';
import { StatusBadge, formatStatusLabel } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Button } from '@/components/ui/button';
import { useDiscountProposals } from '@/hooks/api/useDiscountProposals';
import { useDebounce } from '@/hooks/useDebounce';
import type { DiscountProposalStatus, DiscountTargetSurface } from '@/types/discount.types';
import {
  discountStatusSemantic,
  formatDateTime,
  formatDiscount,
  formatMoney,
  surfaceLabel,
} from './discountProposalAdminUtils';

const pageSize = 10;

export function DiscountProposalsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DiscountProposalStatus | 'all'>('all');
  const [surfaceFilter, setSurfaceFilter] = useState<DiscountTargetSurface | 'all'>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const query = useDiscountProposals({
    page,
    pageSize,
    q: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    targetSurface: surfaceFilter !== 'all' ? surfaceFilter : undefined,
    sort: 'createdAt:desc',
  });
  const rows = query.data?.items ?? [];
  const total = query.data?.pagination.total ?? 0;
  const totalPages = query.data?.pagination.totalPages ?? Math.ceil(total / pageSize);

  const filters = useMemo<FilterConfig<unknown>[]>(
    () => [
      {
        id: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search by dataset or supplier...',
        value: searchQuery,
        onChange: (value) => {
          setSearchQuery(value as string);
          setPage(1);
        },
        showInPrimary: true,
      },
      {
        id: 'status',
        type: 'select',
        label: 'Status',
        value: statusFilter,
        onChange: (value) => {
          setStatusFilter(value as DiscountProposalStatus | 'all');
          setPage(1);
        },
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'SUBMITTED', label: 'Submitted' },
          { value: 'UNDER_REVIEW', label: 'Under Review' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
          { value: 'EXPIRED', label: 'Expired' },
        ],
        showInPrimary: true,
      },
      {
        id: 'surface',
        type: 'select',
        label: 'Price Surface',
        value: surfaceFilter,
        onChange: (value) => {
          setSurfaceFilter(value as DiscountTargetSurface | 'all');
          setPage(1);
        },
        options: [
          { value: 'all', label: 'All Surfaces' },
          { value: 'DATASET_PRICING', label: 'Checkout Price' },
          { value: 'SAMPLE_ACTUAL_PRICE', label: 'Sample Commercial Price' },
        ],
        showInPrimary: true,
      },
    ],
    [searchQuery, statusFilter, surfaceFilter]
  );

  const activeFilters: ActiveFilter[] = [];
  if (searchQuery) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${searchQuery}"`,
      onRemove: () => {
        setSearchQuery('');
        setPage(1);
      },
    });
  }
  if (statusFilter !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `Status: ${formatStatusLabel(statusFilter)}`,
      onRemove: () => {
        setStatusFilter('all');
        setPage(1);
      },
    });
  }
  if (surfaceFilter !== 'all') {
    activeFilters.push({
      key: 'surface',
      label: `Surface: ${surfaceLabel(surfaceFilter)}`,
      onRemove: () => {
        setSurfaceFilter('all');
        setPage(1);
      },
    });
  }

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSurfaceFilter('all');
    setPage(1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-6"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Discount proposals
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Review supplier discount campaigns without changing dataset approval status.
            </p>
          </div>
          <Button variant="outline" onClick={() => query.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        activeFilters={activeFilters}
        onClearAll={activeFilters.length > 0 ? clearAllFilters : undefined}
      />

      <div className="p-6">
        <div
          className="overflow-hidden rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {query.isLoading ? (
            <TableSkeleton columns={7} rows={6} />
          ) : query.isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Failed to load discount proposals.</p>
              <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <BadgePercent
                className="mx-auto mb-3 h-12 w-12"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                No discount proposals found
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {activeFilters.length > 0
                  ? 'Try clearing or changing the active filters.'
                  : 'Supplier discount submissions will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr
                    className="border-b text-left text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <th className="p-4 font-medium uppercase tracking-wide">Dataset</th>
                    <th className="p-4 font-medium uppercase tracking-wide">Supplier</th>
                    <th className="p-4 font-medium uppercase tracking-wide">Surface</th>
                    <th className="p-4 font-medium uppercase tracking-wide">Offer</th>
                    <th className="p-4 font-medium uppercase tracking-wide">Status</th>
                    <th className="p-4 font-medium uppercase tracking-wide">Submitted</th>
                    <th className="p-4 text-right font-medium uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const proposal = item.discountProposal;

                    return (
                      <tr
                        key={proposal.id}
                        className="border-b transition-colors hover:bg-[var(--bg-surface)]"
                        style={{ borderColor: 'var(--border-default)' }}
                      >
                        <td className="p-4 align-top">
                          <p
                            className="max-w-[260px] truncate text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.dataset.title}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.dataset.datasetUniqueId}
                          </p>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {item.supplier?.name || 'Supplier'}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.supplier?.email || '—'}
                          </p>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {surfaceLabel(proposal.targetSurface)}
                          </p>
                          {item.dataset.isSample ? (
                            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                              Sample dataset
                            </p>
                          ) : null}
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm font-medium">{formatDiscount(proposal)}</p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatMoney(proposal.finalPriceSnapshot, proposal.currencySnapshot)}
                          </p>
                        </td>
                        <td className="p-4 align-top">
                          <StatusBadge
                            status={formatStatusLabel(proposal.status)}
                            semanticType={discountStatusSemantic(proposal.status)}
                          />
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {formatDateTime(proposal.submittedAt ?? proposal.createdAt)}
                          </p>
                        </td>
                        <td className="p-4 text-right align-top">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/discount-proposals/${proposal.id}`}>
                              Open review
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {rows.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
              proposals
            </p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
