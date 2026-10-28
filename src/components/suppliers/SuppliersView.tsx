'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, Building2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useDebounce } from '@/hooks/useDebounce';
import { supplierWorkspace } from '@/services/supplier-workspace.service';
import {
  SupplierDirectoryQuerySchema,
  type SupplierDirectoryQuery,
} from '@/lib/supplier-workspace-contracts';
import { SupplierStage, supplierHref, supplierCsv } from './supplierWorkspaceUi';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

const stages = [
  ['ALL', 'All suppliers'],
  ['NEEDS_REVIEW', 'Needs review'],
  ['INVITED', 'Invitations'],
  ['WAITING_FOR_SUPPLIER', 'Awaiting supplier'],
  ['APPROVED', 'Verified'],
  ['REJECTED', 'Rejected'],
];
export function SuppliersView() {
  const router = useRouter(),
    searchParams = useSearchParams();
  const parsed = SupplierDirectoryQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  const filters = parsed.success ? parsed.data : SupplierDirectoryQuerySchema.parse({});
  const [more, setMore] = useState(false);
  const q = useDebounce(filters.q, 300);
  const { can } = useAuthorization();
  const allowed = can({ anyOf: ['VIEW_SUPPLIER', 'MANAGE_SUPPLIER_VERIFICATION'] });
  const params = { ...filters, q, page: q !== filters.q ? 1 : filters.page };
  const query = useQuery({
    queryKey: ['supplier-directory', params],
    queryFn: ({ signal }) => supplierWorkspace.list(params, signal),
    enabled: allowed,
  });
  function change(values: Partial<SupplierDirectoryQuery>) {
    const next = { ...filters, ...values, page: values.page ?? 1 };
    router.replace(
      '/dashboard/suppliers?' +
        new URLSearchParams(Object.entries(next).map(([k, v]) => [k, String(v)])).toString(),
      { scroll: false }
    );
  }
  const result = query.data;
  function exportPage() {
    if (!result?.items.length) return;
    const url = URL.createObjectURL(
      new Blob([supplierCsv(result.items)], { type: 'text/csv;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-directory-page-' + params.page + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const select = (
    key: 'supplierType' | 'accountStatus' | 'contract' | 'sort',
    label: string,
    options: string[][]
  ) => (
    <label htmlFor={`supplier-filter-${key}`} className="space-y-1 text-xs font-medium" key={key}>
      {label}
      <select
        id={`supplier-filter-${key}`}
        aria-label={label}
        value={filters[key]}
        onChange={(e) => change({ [key]: e.target.value })}
        className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
      >
        {options.map(([v, l]) => (
          <option value={v} key={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
  if (!allowed) return <p className="p-6">You do not have permission to view suppliers.</p>;
  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Capabilities, onboarding and supplier activity in one place."
        actions={
          <Button variant="outline" disabled={!result?.items.length} onClick={exportPage}>
            <Download />
            Export this page
          </Button>
        }
      />
      <div className="space-y-5 p-4 sm:p-6">
        <nav aria-label="Supplier stages" className="flex flex-wrap gap-2">
          {stages.map(([value, label]) => (
            <Button
              size="sm"
              key={value}
              variant={filters.stage === value ? 'default' : 'outline'}
              onClick={() => change({ stage: value as SupplierDirectoryQuery['stage'] })}
            >
              {label}
            </Button>
          ))}
        </nav>
        <div className="rounded-lg border bg-background p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="supplier-directory-search" className="relative flex-1">
              <span className="sr-only">Search suppliers</span>
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="supplier-directory-search"
                className="pl-9"
                placeholder="Name, email, ID, domain, format or capability"
                value={filters.q}
                onChange={(e) => {
                  change({ q: e.target.value });
                }}
              />
            </label>
            <Button variant="outline" onClick={() => setMore(!more)} aria-expanded={more}>
              Filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                router.replace('/dashboard/suppliers');
              }}
            >
              Clear
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {select('supplierType', 'Supplier type', [
              ['ALL', 'All types'],
              ['INDIVIDUAL', 'Individual'],
              ['COMPANY', 'Company'],
            ])}
            {select('accountStatus', 'Account status', [
              ['ALL', 'All account states'],
              ['NO_ACCOUNT', 'No account yet'],
              ['ACTIVE', 'Active'],
              ['INACTIVE', 'Inactive'],
              ['SUSPENDED', 'Suspended'],
              ['PENDING_VERIFICATION', 'Pending verification'],
              ['DELETED', 'Deleted'],
            ])}
            {select('contract', 'Offline contract', [
              ['ALL', 'All contract states'],
              ['COMPLETE', 'Complete'],
              ['PENDING', 'Pending / not recorded'],
            ])}
            {select('sort', 'Sort by', [
              ['updatedAt:desc', 'Recently updated'],
              ['createdAt:desc', 'Newest first'],
              ['name:asc', 'Name A–Z'],
            ])}
          </div>
          {more && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(['country', 'domain', 'modality', 'format'] as const).map((key) => (
                <label
                  htmlFor={`supplier-filter-${key}`}
                  className="text-xs font-medium capitalize"
                  key={key}
                >
                  {key}
                  <Input
                    id={`supplier-filter-${key}`}
                    aria-label={key}
                    className="mt-1"
                    value={filters[key]}
                    onChange={(e) => change({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
        {query.isPending ? (
          <p role="status">Loading supplier directory…</p>
        ) : query.isError ? (
          <div role="alert" className="rounded-lg border p-6">
            <p>{getFriendlyErrorMessage(query.error)}</p>
            <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {[
                      'Supplier',
                      'Capabilities',
                      'Onboarding',
                      'Account / contract',
                      'Reviewer',
                      'Updated',
                    ].map((h) => (
                      <th scope="col" className="p-4 font-medium" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result?.items.map((r) => (
                    <tr className="border-b last:border-0 hover:bg-muted/20" key={r.recordId}>
                      <td className="p-4 min-w-64">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                            {r.logoUrl ? (
                              <Image
                                src={r.logoUrl}
                                alt=""
                                width={40}
                                height={40}
                                unoptimized
                                className="h-full w-full object-contain"
                              />
                            ) : r.supplierType === 'COMPANY' ? (
                              <Building2 className="h-5 w-5" />
                            ) : (
                              <UserRound className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={
                                supplierHref(r) +
                                '?returnTo=' +
                                encodeURIComponent(
                                  '/dashboard/suppliers?' +
                                    new URLSearchParams(
                                      Object.entries(params).map(([k, v]) => [k, String(v)])
                                    )
                                )
                              }
                              className="font-semibold underline-offset-4 hover:underline"
                            >
                              {r.name}
                            </Link>
                            <p className="text-xs text-muted-foreground break-all">{r.email}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {r.supplierType === 'COMPANY'
                                ? 'Company'
                                : r.supplierType === 'INDIVIDUAL'
                                  ? 'Individual'
                                  : 'Type not provided'}{' '}
                              · {r.country || 'Country not provided'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 min-w-48 max-w-72">
                        <p>
                          {r.domains.slice(0, 2).join(', ') || 'Not provided'}
                          {r.domains.length > 2 ? ` +${r.domains.length - 2}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.offerings.slice(0, 2).join(', ')}
                        </p>
                      </td>
                      <td className="p-4">
                        <SupplierStage stage={r.stage} />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p>{r.accountStatus?.replaceAll('_', ' ') || 'No account yet'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Contract:{' '}
                          {r.contractComplete === null
                            ? 'Not recorded'
                            : r.contractComplete
                              ? 'Complete'
                              : 'Pending'}
                        </p>
                      </td>
                      <td className="p-4">{r.reviewer?.name || '—'}</td>
                      <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!result?.items.length && (
                <p className="p-10 text-center text-muted-foreground">
                  No suppliers match these filters.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                {result?.total ?? 0} suppliers · page {params.page}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={params.page === 1}
                  onClick={() => change({ page: params.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={params.page * params.pageSize >= (result?.total ?? 0)}
                  onClick={() => change({ page: params.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
