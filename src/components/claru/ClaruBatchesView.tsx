'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useClaruBatches, useClaruProjects } from '@/hooks/api/useClaru';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { formatDate } from '@/utils/date.utils';
import { ClaruCreateBatchDialog } from './ClaruCreateBatchDialog';

export function ClaruBatchesView() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [projectId, setProjectId] = useState('ALL');
  const debouncedQ = useDebounce(q, 350);
  const { can } = useAuthorization();
  const projectsQuery = useClaruProjects();
  const batchesQuery = useClaruBatches({
    page,
    pageSize: 20,
    q: debouncedQ || undefined,
    projectId: projectId === 'ALL' ? undefined : projectId,
  });

  const projects = projectsQuery.data?.projects ?? [];
  const batches = batchesQuery.data?.items ?? [];
  const pagination = batchesQuery.data?.pagination;
  const canManage = can({ anyOf: [PERMISSIONS.CLARU.MANAGE] });
  const clipsOnPage = batches.reduce((total, batch) => total + batch.submissionCount, 0);
  const blocked = projectsQuery.data?.team.blocked;

  return (
    <div className="min-h-screen bg-[var(--bg-surface)]">
      <PageHeader
        title="Claru deliveries"
        description="Prepare, upload, validate, and track commercial egocentric video deliveries."
        actions={
          canManage ? (
            <ClaruCreateBatchDialog
              projects={projects}
              disabled={projectsQuery.isLoading || Boolean(blocked) || projects.length === 0}
            />
          ) : null
        }
      />

      {blocked ? (
        <div
          className="border-b px-4 py-3 text-sm sm:px-6"
          role="alert"
          style={{
            backgroundColor: 'var(--status-error-bg)',
            borderColor: 'var(--status-error-border)',
            color: 'var(--status-error)',
          }}
        >
          <span className="font-semibold">Claru delivery is blocked:</span> {blocked.remedy}
        </div>
      ) : null}

      <div className="space-y-5 p-4 sm:p-6">
        {projectsQuery.isError ||
        (!projectsQuery.isLoading && !blocked && projects.length === 0) ? (
          <Card role="alert" className="border-[var(--status-warning-border)]">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {projectsQuery.isError
                    ? 'Claru connection unavailable'
                    : 'No assigned Claru projects'}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {projectsQuery.isError
                    ? 'Existing batches are still available. Retry the connection to create new deliveries.'
                    : 'Ask your Claru contact to assign a project, then refresh the list.'}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={projectsQuery.isFetching}
                onClick={() => projectsQuery.refetch()}
              >
                Refresh projects
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: q || projectId !== 'ALL' ? 'Matching batches' : 'Delivery batches',
              value: pagination?.total ?? '—',
            },
            { label: 'Clips on this page', value: clipsOnPage },
            {
              label: 'Active projects',
              value: projectsQuery.isLoading || projectsQuery.isError ? '—' : projects.length,
            },
            {
              label: 'Contract version',
              value: projectsQuery.data ? `v${projectsQuery.data.contract.version}` : '—',
            },
          ].map((item) => (
            <Card key={item.label} className="shadow-[var(--shadow-card)]">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_minmax(220px,320px)]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <Input
                  value={q}
                  onChange={(event) => {
                    setQ(event.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                  aria-label="Search Claru delivery batches"
                  placeholder="Search batch name or reference"
                />
              </div>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter delivery batches by project">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem value={project.id} key={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {batchesQuery.isLoading ? (
          <TableSkeleton columns={5} rows={8} showHeader={false} />
        ) : batchesQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium">Delivery batches could not be loaded</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Check the backend connection and retry this view.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => batchesQuery.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : batches.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="font-medium">No delivery batches found</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-muted)]">
                {q || projectId !== 'ALL'
                  ? 'Clear the current filters to see other batches.'
                  : canManage
                    ? 'Create the first batch to start preparing clips for Claru.'
                    : 'A delivery manager can create the first batch.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className="hidden overflow-hidden rounded-lg border bg-[var(--bg-base)] md:block"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:px-4">
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-[var(--bg-hover)]">
                    <TableHead>Batch</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Clips</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/claru/batches/${batch.id}`}
                          className="font-semibold text-[var(--text-primary)] hover:underline"
                        >
                          {batch.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-64 truncate">
                        {batch.projectName ?? 'Claru project'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-[var(--text-secondary)]">
                          {batch.batchRef ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {batch.submissionCount}
                      </TableCell>
                      <TableCell>{formatDate(batch.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/claru/batches/${batch.id}`}>Open batch</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {batches.map((batch) => (
                <Link
                  className="block"
                  href={`/dashboard/claru/batches/${batch.id}`}
                  key={batch.id}
                >
                  <Card className="transition-colors hover:bg-[var(--bg-hover)]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{batch.name}</p>
                          <p className="mt-1 truncate text-sm text-[var(--text-muted)]">
                            {batch.projectName ?? 'Claru project'}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium">
                          {batch.submissionCount} clips
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                        <span className="truncate font-mono">
                          {batch.batchRef ?? 'No batch reference'}
                        </span>
                        <span className="shrink-0">{formatDate(batch.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {(pagination?.totalPages ?? 1) > 1 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--text-muted)]">
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
