'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useDataRequirements } from '@/hooks/api/useDataRequirements';
import { useDebounce } from '@/hooks/useDebounce';
import type { DataRequirementSource, DataRequirementStatus } from '@/types';
import { formatDate, sourceLabel, statusLabel, statusSemantic } from './dataRequirementAdminUtils';

const statuses: Array<DataRequirementStatus | 'ALL'> = [
  'ALL',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'CLOSED',
  'ARCHIVED',
];
const sources: Array<DataRequirementSource | 'ALL'> = [
  'ALL',
  'USER_APP',
  'SUPPLIER_PANEL',
  'LEGACY_IMPORT',
];

export function DataRequirementsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<DataRequirementStatus | 'ALL'>('ALL');
  const [source, setSource] = useState<DataRequirementSource | 'ALL'>('ALL');
  const [sort, setSort] = useState<'NEWEST' | 'OLDEST' | 'UPDATED'>('NEWEST');
  const debouncedQ = useDebounce(q, 350);
  const query = useDataRequirements({
    page,
    pageSize: 20,
    q: debouncedQ || undefined,
    status: status === 'ALL' ? undefined : status,
    source: source === 'ALL' ? undefined : source,
    sort,
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const pagination = query.data?.pagination;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Data requirements
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Review submissions, prepare public details, and control marketplace visibility.
            </p>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {pagination?.total ?? 0} total
          </p>
        </div>
      </div>

      <div
        className="border-b p-4 sm:px-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px_170px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <Input
              aria-label="Search data requirements"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder="Search title, submitter, email, or organisation"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as DataRequirementStatus | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter data requirements by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((item) => (
                <SelectItem value={item} key={item}>
                  {item === 'ALL' ? 'All statuses' : statusLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={source}
            onValueChange={(value) => {
              setSource(value as DataRequirementSource | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter data requirements by origin">
              <SelectValue placeholder="Origin" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((item) => (
                <SelectItem value={item} key={item}>
                  {item === 'ALL' ? 'All origins' : sourceLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger aria-label="Sort data requirements">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEWEST">Newest first</SelectItem>
              <SelectItem value="OLDEST">Oldest first</SelectItem>
              <SelectItem value="UPDATED">Recently updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {query.isLoading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : query.isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Could not load data requirements
              </p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                No requirements match these filters
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                New user and supplier submissions will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className="hidden overflow-hidden rounded-lg border md:block"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-default)',
              }}
            >
              <Table className="[&_td]:px-3 [&_td]:py-3 [&_th]:px-3">
                <TableHeader>
                  <TableRow
                    className="hover:bg-transparent"
                    style={{
                      backgroundColor: 'var(--bg-hover)',
                      borderColor: 'var(--border-default)',
                    }}
                  >
                    <TableHead>Reference</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open data requirement ${item.referenceCode}: ${item.title}`}
                      className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      style={{ borderColor: 'var(--border-default)' }}
                      onClick={() => router.push(`/dashboard/data-requirements/${item.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          router.push(`/dashboard/data-requirements/${item.id}`);
                        }
                      }}
                    >
                      <TableCell>
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: 'var(--state-info)' }}
                        >
                          {item.referenceCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="max-w-[360px] truncate font-medium">{item.title}</p>
                          <p
                            className="mt-0.5 max-w-[360px] truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.organization || 'No organisation provided'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{sourceLabel(item.source)}</TableCell>
                      <TableCell>{item.contactName}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={statusLabel(item.status)}
                          semanticType={statusSemantic(item.status)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {items.map((item) => (
                <Link href={`/dashboard/data-requirements/${item.id}`} key={item.id}>
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: 'var(--brand-primary)' }}
                          >
                            {item.referenceCode}
                          </p>
                          <p className="mt-1 font-semibold">{item.title}</p>
                        </div>
                        <StatusBadge
                          status={statusLabel(item.status)}
                          semanticType={statusSemantic(item.status)}
                        />
                      </div>
                      <div
                        className="flex justify-between text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span>{sourceLabel(item.source)}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {(pagination?.totalPages ?? 0) > 1 ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Page {pagination?.page} of {pagination?.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= (pagination?.totalPages ?? 1)}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
