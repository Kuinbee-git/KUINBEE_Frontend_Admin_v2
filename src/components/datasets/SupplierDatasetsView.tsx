'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatStatusLabel,
  getDatasetStatusSemantic,
  StatusBadge,
} from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { datasetContentKeys } from '@/hooks/api/useDatasetContentQueue';
import { useDebounce } from '@/hooks/useDebounce';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { datasetContentApi, type AdminSupplierDataset } from '@/services/dataset-content.service';
import { useAuthStore } from '@/store/auth.store';

const pageSize = 20;
const statuses = [
  'PUBLISHED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'DELISTED',
  'ARCHIVED',
] as const satisfies readonly AdminSupplierDataset['status'][];
const visibilities = ['PUBLIC', 'UNLISTED', 'PRIVATE'] as const;
const date = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' });

function DatasetLink({ item }: { item: AdminSupplierDataset }) {
  return (
    <Link
      href={`/dashboard/supplier-datasets/${item.id}`}
      className="inline-flex items-start gap-1.5 break-words font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:underline"
    >
      <span className="min-w-0">{item.title}</span>
      <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
    </Link>
  );
}

function DatasetStatus({ status }: { status: AdminSupplierDataset['status'] }) {
  return (
    <StatusBadge
      status={formatStatusLabel(status)}
      semanticType={getDatasetStatusSemantic(status)}
    />
  );
}

export function SupplierDatasetsView() {
  const actorId = useAuthStore((state) => state.user?.id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminSupplierDataset['status'] | 'ALL'>('PUBLISHED');
  const [visibility, setVisibility] = useState<AdminSupplierDataset['visibility'] | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const params = {
    page,
    pageSize,
    q: debouncedSearch || undefined,
    status: status === 'ALL' ? undefined : status,
    visibility: visibility === 'ALL' ? undefined : visibility,
  };
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...datasetContentKeys, actorId, 'supplier-catalogue', params],
    enabled: Boolean(actorId),
    retry: false,
    queryFn: ({ signal }) => datasetContentApi.supplierCatalogue(params, signal),
  });
  const reset = () => {
    setSearch('');
    setStatus('ALL');
    setVisibility('ALL');
    setPage(1);
  };
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Supplier Datasets</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Find published listings and submissions across suppliers.
        </p>
      </header>
      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
        <div className="flex flex-wrap items-end gap-3 border-b border-[var(--border-default)] p-4 sm:p-5">
          <div className="min-w-0 flex-1 basis-56 space-y-1.5 text-sm font-medium">
            <label htmlFor="supplier-dataset-search">Search</label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-2.5 size-4 text-[var(--text-muted)]"
                aria-hidden
              />
              <Input
                id="supplier-dataset-search"
                className="pl-9"
                placeholder="Dataset title, ID, supplier name or email"
                value={search}
                maxLength={200}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5 text-sm font-medium">
            <label htmlFor="supplier-dataset-status">Status</label>
            <Select
              value={status}
              onValueChange={(value: typeof status) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="supplier-dataset-status" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {statuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 text-sm font-medium">
            <label htmlFor="supplier-dataset-visibility">Visibility</label>
            <Select
              value={visibility}
              onValueChange={(value: typeof visibility) => {
                setVisibility(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="supplier-dataset-visibility" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All visibility</SelectItem>
                {visibilities.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            onClick={reset}
            disabled={!search && status === 'ALL' && visibility === 'ALL'}
          >
            Clear filters
          </Button>
        </div>
        {isPending ? (
          <div role="status" aria-label="Loading supplier datasets">
            <TableSkeleton columns={6} rows={6} />
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 p-8 text-center">
            <h2 className="font-semibold">Could not load supplier datasets</h2>
            <p className="text-sm text-[var(--text-muted)]">{getFriendlyErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-1.5 p-8 text-center">
            <h2 className="font-semibold">No supplier datasets found</h2>
            <p className="text-sm text-[var(--text-muted)]">Try a different search or filter.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-muted)]">
                  <tr>
                    {[
                      'Dataset',
                      'Supplier',
                      'Category',
                      'Status',
                      'Visibility',
                      'Last updated',
                    ].map((label) => (
                      <th key={label} scope="col" className="px-4 py-3 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {rows.map((item) => (
                    <tr key={item.id} className="align-top hover:bg-[var(--bg-hover)]">
                      <td className="w-[33%] min-w-44 px-4 py-4">
                        <DatasetLink item={item} />
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {item.datasetUniqueId}
                        </div>
                      </td>
                      <td className="max-w-52 px-4 py-4">
                        <div className="font-medium">
                          {item.supplier?.name ?? 'Supplier unavailable'}
                        </div>
                        {item.supplier && item.supplier.email !== item.supplier.name && (
                          <div className="mt-1 break-all text-xs text-[var(--text-muted)]">
                            {item.supplier.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">{item.primaryCategory?.name ?? 'Uncategorised'}</td>
                      <td className="px-4 py-4">
                        <DatasetStatus status={item.status} />
                      </td>
                      <td className="px-4 py-4">{formatStatusLabel(item.visibility)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[var(--text-muted)]">
                        {date.format(new Date(item.updatedAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-[var(--border-default)] text-sm md:hidden">
              {rows.map((item) => (
                <li key={item.id} className="space-y-2 p-4">
                  <DatasetLink item={item} />
                  <p className="text-xs text-[var(--text-muted)]">{item.datasetUniqueId}</p>
                  <p>{item.supplier?.name ?? 'Supplier unavailable'}</p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <DatasetStatus status={item.status} />
                    <span>{formatStatusLabel(item.visibility)}</span>
                    <span>Updated {date.format(new Date(item.updatedAt))}</span>
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
        {!isPending && !isError && total > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] p-4 sm:px-5">
            <p className="text-sm text-[var(--text-muted)]">
              {total.toLocaleString()} datasets · Page {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
