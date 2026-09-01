'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useCustomCollectionServices } from '@/hooks/api/useCustomCollection';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import type {
  CustomCollectionAdminView,
  CustomCollectionAssignmentFilter,
  CustomCollectionRevisionStatus,
  CustomCollectionServiceSummary,
} from '@/types';
import {
  formatCustomCollectionStatus,
  formatDate,
  revisionStatusSemantic,
} from './customCollectionAdminUtils';

const REVIEW_STATUSES: Array<CustomCollectionRevisionStatus | 'ALL'> = [
  'ALL',
  'SUBMITTED',
  'RESUBMITTED',
  'UNDER_REVIEW',
];

const ALL_STATUSES: Array<CustomCollectionRevisionStatus | 'ALL'> = [
  ...REVIEW_STATUSES,
  'DRAFT',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'SUPERSEDED',
];

type ViewOption = {
  value: CustomCollectionAdminView;
  label: string;
  description: string;
};

const DEFAULT_VIEW_OPTION: ViewOption = {
  value: 'REVIEW_QUEUE',
  label: 'Review queue',
  description: 'Supplier submissions that are ready for review or already assigned.',
};

const VIEW_OPTIONS: ViewOption[] = [
  DEFAULT_VIEW_OPTION,
  {
    value: 'PUBLISHED',
    label: 'Published',
    description: 'Approved services that are currently visible in the marketplace.',
  },
  {
    value: 'PRIVATE',
    label: 'Approved / private',
    description: 'Approved services that suppliers have not published or have unpublished.',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    description: 'Services removed from active supplier and marketplace workflows.',
  },
  {
    value: 'ALL',
    label: 'All services',
    description: 'Every custom collection service across all lifecycle states.',
  },
];

const isAdminView = (value: string | null): value is CustomCollectionAdminView =>
  VIEW_OPTIONS.some((option) => option.value === value);

const activeRevision = (
  service: CustomCollectionServiceSummary,
  view: CustomCollectionAdminView
) => {
  if (view === 'REVIEW_QUEUE') return service.workingRevision ?? service.publishedRevision;
  if (view === 'PUBLISHED' || view === 'PRIVATE') {
    return service.publishedRevision ?? service.workingRevision;
  }
  if (view === 'ARCHIVED') return service.publishedRevision ?? service.workingRevision;
  return service.workingRevision ?? service.publishedRevision;
};

const visibilityBadge = (service: CustomCollectionServiceSummary) => {
  if (service.archivedAt) {
    return <StatusBadge status="Archived" semanticType="neutral" />;
  }
  if (!service.publishedRevision) {
    return <span style={{ color: 'var(--text-muted)' }}>Not approved</span>;
  }
  return (
    <StatusBadge
      status={service.isPublished ? 'Public' : 'Private'}
      semanticType={service.isPublished ? 'success' : 'neutral'}
    />
  );
};

function ServiceMobileCard({
  service,
  view,
}: {
  service: CustomCollectionServiceSummary;
  view: CustomCollectionAdminView;
}) {
  const revision = activeRevision(service, view);
  if (!revision) return null;

  return (
    <Link href={`/dashboard/custom-collection-services/${service.id}?from=${view}`}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="truncate text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {revision.title}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {service.supplier.displayName}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <StatusBadge
                status={formatCustomCollectionStatus(revision.status)}
                semanticType={revisionStatusSemantic(revision.status)}
              />
              {visibilityBadge(service)}
            </div>
          </div>
          <p className="line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {revision.shortDescription}
          </p>
          <div
            className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Revision v{revision.version}</span>
            <span className="text-right">
              {service.archivedAt
                ? 'Archived'
                : formatDate(revision.submittedAt ?? revision.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CustomCollectionServicesView() {
  const searchParams = useSearchParams();
  const { can } = useAuthorization();
  const canManageLeads = can({
    anyOf: [PERMISSIONS.CUSTOM_COLLECTION.MANAGE_LEADS],
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CustomCollectionRevisionStatus | 'ALL'>('ALL');
  const [assignedTo, setAssignedTo] = useState<CustomCollectionAssignmentFilter>('ANY');
  const [view, setView] = useState<CustomCollectionAdminView>(() => {
    const requestedView = searchParams.get('view');
    return isAdminView(requestedView) ? requestedView : 'REVIEW_QUEUE';
  });
  const debouncedQ = useDebounce(q, 400);
  const viewConfig = VIEW_OPTIONS.find((option) => option.value === view) ?? DEFAULT_VIEW_OPTION;
  const showStatusFilter = view !== 'PUBLISHED' && view !== 'PRIVATE';
  const showAssignmentFilter = view === 'REVIEW_QUEUE' || view === 'ALL';
  const statusOptions = view === 'REVIEW_QUEUE' ? REVIEW_STATUSES : ALL_STATUSES;

  const query = useCustomCollectionServices({
    page,
    pageSize,
    q: debouncedQ || undefined,
    status: status === 'ALL' ? undefined : status,
    assignedTo: showAssignmentFilter ? assignedTo : undefined,
    view,
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const total = query.data?.pagination.total ?? 0;
  const totalPages = query.data?.pagination.totalPages ?? 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Custom services
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Review submissions and inspect what is public, private, or archived.
            </p>
          </div>
          {canManageLeads ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/custom-collection-leads">Open leads</Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto pb-1">
          <Tabs
            value={view}
            onValueChange={(value) => {
              const nextView = value as CustomCollectionAdminView;
              setView(nextView);
              setStatus('ALL');
              setAssignedTo('ANY');
              setPage(1);
            }}
          >
            <TabsList className="h-auto min-w-max">
              {VIEW_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {viewConfig.description}
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {total} {total === 1 ? 'service' : 'services'}
          </p>
        </div>
      </div>

      <div
        className="border-b p-4"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div
          className={`grid gap-3 ${
            showStatusFilter && showAssignmentFilter
              ? 'lg:grid-cols-[1fr_220px_220px_auto]'
              : showStatusFilter || showAssignmentFilter
                ? 'lg:grid-cols-[1fr_220px_auto]'
                : 'lg:grid-cols-[1fr_auto]'
          }`}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <Input
              aria-label="Search custom collection services"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder="Search service title, supplier, or slug"
              className="pl-9"
            />
          </div>
          {showStatusFilter ? (
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as CustomCollectionRevisionStatus | 'ALL');
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Filter custom collection services by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === 'ALL' ? 'All statuses' : formatCustomCollectionStatus(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {showAssignmentFilter ? (
            <Select
              value={assignedTo}
              onValueChange={(value) => {
                setAssignedTo(value as CustomCollectionAssignmentFilter);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Filter custom collection services by assignment">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">All assignments</SelectItem>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                <SelectItem value="ME">Assigned to me</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setQ('');
              setStatus('ALL');
              setAssignedTo('ANY');
              setPage(1);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div
          className="overflow-hidden rounded-lg border"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
        >
          {query.isLoading ? (
            <TableSkeleton columns={8} rows={6} />
          ) : query.isError ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">Failed to load custom service queue.</p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                No custom services found
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Try a different lifecycle view, filter, or search term.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: 'var(--border-default)' }}>
                      <TableHead>Service</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((service) => {
                      const revision = activeRevision(service, view);
                      if (!revision) return null;
                      return (
                        <TableRow key={service.id} style={{ borderColor: 'var(--border-default)' }}>
                          <TableCell className="max-w-[360px]">
                            <p className="truncate font-medium">{revision.title}</p>
                            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                              {revision.shortDescription}
                            </p>
                          </TableCell>
                          <TableCell>{service.supplier.displayName}</TableCell>
                          <TableCell>
                            <StatusBadge
                              status={formatCustomCollectionStatus(revision.status)}
                              semanticType={revisionStatusSemantic(revision.status)}
                            />
                          </TableCell>
                          <TableCell>{visibilityBadge(service)}</TableCell>
                          <TableCell>{revision.reviewedBy?.displayName ?? 'Unassigned'}</TableCell>
                          <TableCell>{formatDate(revision.submittedAt)}</TableCell>
                          <TableCell>v{revision.version}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/dashboard/custom-collection-services/${service.id}?from=${view}`}
                              >
                                {view === 'REVIEW_QUEUE' ? 'Review' : 'Open'}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 p-3 md:hidden">
                {items.map((service) => (
                  <ServiceMobileCard key={service.id} service={service} view={view} />
                ))}
              </div>
            </>
          )}
        </div>

        {!query.isLoading && items.length > 0 && query.data?.pagination ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
