'use client';

import { useState } from 'react';
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
import { DetailSkeleton } from '@/components/shared/DetailSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useClaruBatch, useClaruProjects, useClaruSubmissions } from '@/hooks/api/useClaru';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/lib/constants/permissions';
import type { ClaruSubmissionState } from '@/types';
import { formatDateTime } from '@/utils/date.utils';
import { ClaruCreateSubmissionDialog } from './ClaruCreateSubmissionDialog';
import {
  claruFileTypeLabel,
  claruStateLabel,
  claruStateSemantic,
  formatClaruDuration,
} from './claruAdminUtils';

const states: Array<ClaruSubmissionState | 'ALL'> = [
  'ALL',
  'draft',
  'processing',
  'in_review',
  'approved',
  'refused',
  'rejected',
  'expired',
];

export function ClaruBatchWorkspace({ batchId }: { batchId: string }) {
  const router = useRouter();
  const { can } = useAuthorization();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [state, setState] = useState<ClaruSubmissionState | 'ALL'>('ALL');
  const debouncedQ = useDebounce(q, 350);
  const batchQuery = useClaruBatch(batchId);
  const projectsQuery = useClaruProjects();
  const submissionsQuery = useClaruSubmissions({
    batchId,
    page,
    pageSize: 50,
    q: debouncedQ || undefined,
    state: state === 'ALL' ? undefined : state,
  });

  if (batchQuery.isLoading) return <DetailSkeleton />;

  if (batchQuery.isError || !batchQuery.data) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="mx-auto max-w-xl">
          <CardContent className="py-12 text-center">
            <p className="font-medium">Delivery batch could not be loaded</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              It may no longer exist, or the backend is unavailable.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/claru')}>
                Back to deliveries
              </Button>
              <Button onClick={() => batchQuery.refetch()}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const batch = batchQuery.data;
  const project = projectsQuery.data?.projects.find((item) => item.id === batch.projectId);
  const submissions = submissionsQuery.data?.items ?? [];
  const pagination = submissionsQuery.data?.pagination;
  const canManage = can({ anyOf: [PERMISSIONS.CLARU.MANAGE] });
  const blocked = projectsQuery.data?.team.blocked;
  const visibleCounts = submissions.reduce(
    (counts, submission) => ({
      ...counts,
      [submission.state]: counts[submission.state] + 1,
    }),
    {
      draft: 0,
      processing: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      refused: 0,
      expired: 0,
    } satisfies Record<ClaruSubmissionState, number>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] [&_h1]:break-words">
      <PageHeader
        title={batch.name}
        description={
          <span>
            {batch.projectName ?? 'Claru project'}
            {batch.batchRef ? ` · ${batch.batchRef}` : ''}
          </span>
        }
        onBack={() => router.push('/dashboard/claru')}
        backLabel="Back to Claru deliveries"
        actions={
          canManage && project && !blocked ? (
            <ClaruCreateSubmissionDialog batch={batch} project={project} />
          ) : null
        }
      />

      <div className="space-y-5 p-4 sm:p-6">
        {blocked ? (
          <Card
            className="border-[var(--status-error-border)] bg-[var(--status-error-bg)] shadow-none"
            role="alert"
          >
            <CardContent className="p-4 text-sm text-[var(--status-error)]">
              <span className="font-semibold">Claru delivery is blocked:</span> {blocked.remedy}
            </CardContent>
          </Card>
        ) : null}
        {project ? (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold">Current project requirements</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Loaded live from Claru. The rules are checked again before every submission.
                  </p>
                </div>
                <div className="grid min-w-0 flex-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Clip length</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatClaruDuration(project.clipLength.minSeconds)}–
                      {formatClaruDuration(project.clipLength.maxSeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">File roles</p>
                    <p className="mt-1 text-sm font-medium">
                      {project.expectedFiles
                        .map(
                          (file) =>
                            `${claruFileTypeLabel(file.fileType)}${file.required ? ' *' : ''}`
                        )
                        .join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Capture profile</p>
                    <p className="mt-1 text-sm font-medium">
                      {project.captureAspectRatio} · IMU {project.checkGroups.imu}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : projectsQuery.isError ? (
          <Card
            className="border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] shadow-none"
            role="alert"
          >
            <CardContent className="p-4 text-sm text-[var(--status-warning)]">
              Live Claru project rules are unavailable. Existing clips remain visible, but new clip
              creation is disabled until discovery succeeds.
              <Button
                className="ml-3"
                variant="outline"
                size="sm"
                disabled={projectsQuery.isFetching}
                onClick={() => projectsQuery.refetch()}
              >
                Retry connection
              </Button>
            </CardContent>
          </Card>
        ) : !projectsQuery.isLoading ? (
          <Card role="status">
            <CardContent className="p-4 text-sm text-[var(--text-secondary)]">
              This project is no longer available to your Claru team. Existing deliveries remain
              visible. Refresh project access before adding clips.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: q || state !== 'ALL' ? 'Matching clips' : 'Total clips',
              value: pagination?.total ?? batch.submissionCount,
            },
            { label: 'Draft on this page', value: visibleCounts.draft },
            {
              label: 'In progress on this page',
              value: visibleCounts.processing + visibleCounts.in_review,
            },
            { label: 'Approved on this page', value: visibleCounts.approved },
          ].map((item) => (
            <Card key={item.label} className="shadow-[var(--shadow-card)]">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_220px]">
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
                  aria-label="Search clips in this batch"
                  placeholder="Search external reference, Claru ID, or filename"
                />
              </div>
              <Select
                value={state}
                onValueChange={(value) => {
                  setState(value as ClaruSubmissionState | 'ALL');
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter clips by delivery state">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((item) => (
                    <SelectItem value={item} key={item}>
                      {item === 'ALL' ? 'All states' : claruStateLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {submissionsQuery.isLoading ? (
          <TableSkeleton columns={6} rows={8} showHeader={false} />
        ) : submissionsQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium">Clips could not be loaded</p>
              <Button className="mt-4" variant="outline" onClick={() => submissionsQuery.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="font-medium">No clips in this view</p>
              <p className="mx-auto mt-1 max-w-lg text-sm text-[var(--text-muted)]">
                {q || state !== 'ALL'
                  ? 'Change the search or state filter to see other clips.'
                  : canManage
                    ? 'Add the first clip, confirm its declaration, and continue to upload.'
                    : 'A delivery manager can add the first clip.'}
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
                  <TableRow className="bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]">
                    <TableHead>External reference</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => {
                    const uploaded = submission.parts.filter(
                      (part) => part.uploadState === 'uploaded'
                    ).length;
                    const category = project?.categories.find(
                      (item) => item.code === submission.declared.categoryCode
                    );
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/claru/submissions/${submission.id}`}
                            className="font-mono text-xs font-semibold text-[var(--state-info)] hover:underline"
                          >
                            {submission.externalRef}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {category?.name ?? submission.declared.categoryCode ?? '—'}
                        </TableCell>
                        <TableCell>
                          {uploaded}/{submission.parts.length} complete
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={claruStateLabel(submission.state)}
                            semanticType={claruStateSemantic(submission.state)}
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(submission.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/claru/submissions/${submission.id}`}>
                              Open clip
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {submissions.map((submission) => {
                const uploaded = submission.parts.filter(
                  (part) => part.uploadState === 'uploaded'
                ).length;
                return (
                  <Link
                    className="block"
                    href={`/dashboard/claru/submissions/${submission.id}`}
                    key={submission.id}
                  >
                    <Card className="transition-colors hover:bg-[var(--bg-hover)]">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate font-mono text-xs font-semibold text-[var(--state-info)]">
                            {submission.externalRef}
                          </p>
                          <StatusBadge
                            status={claruStateLabel(submission.state)}
                            semanticType={claruStateSemantic(submission.state)}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>
                            {uploaded}/{submission.parts.length} files complete
                          </span>
                          <span>{formatDateTime(submission.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
