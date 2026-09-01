'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useCustomCollectionLeads } from '@/hooks/api/useCustomCollection';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import type { CustomCollectionLead, CustomCollectionLeadStatus } from '@/types';
import {
  formatCustomCollectionStatus,
  formatDateTime,
  leadStatusSemantic,
} from './customCollectionAdminUtils';

const LEAD_STATUSES: Array<CustomCollectionLeadStatus | 'ALL'> = [
  'ALL',
  'NEW',
  'CONTACTED',
  'QUALIFYING',
  'WON',
  'LOST',
  'SPAM',
];

function LeadMobileCard({ lead }: { lead: CustomCollectionLead }) {
  return (
    <Link href={`/dashboard/custom-collection-leads/${lead.id}`}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{lead.fullName}</p>
              <p className="mt-1 truncate text-sm" style={{ color: 'var(--text-muted)' }}>
                {lead.organization} · {lead.email}
              </p>
            </div>
            <StatusBadge
              status={formatCustomCollectionStatus(lead.status)}
              semanticType={leadStatusSemantic(lead.status)}
            />
          </div>
          <div
            className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>{lead.submissionType === 'SIGNED_IN_ONE_TAP' ? 'One-tap' : 'Guest form'}</span>
            <span className="text-right">{formatDateTime(lead.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CustomCollectionLeadsView() {
  const { can } = useAuthorization();
  const canReviewServices = can({
    anyOf: [PERMISSIONS.CUSTOM_COLLECTION.REVIEW_SERVICES],
  });
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId') || undefined;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<CustomCollectionLeadStatus | 'ALL'>('NEW');

  const query = useCustomCollectionLeads({
    page,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    serviceId,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.pagination.total ?? 0;
  const totalPages = query.data?.pagination.totalPages ?? 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div
        className="border-b p-4 sm:p-6"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              <h1 className="text-2xl font-bold">Custom service leads</h1>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Manage buyer requests generated from custom collection service listings.
            </p>
            {serviceId ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Filtered to one custom service</span>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Link href="/dashboard/custom-collection-leads">Clear filter</Link>
                </Button>
              </div>
            ) : null}
          </div>
          {canReviewServices ? (
            <Button asChild variant="outline">
              <Link href="/dashboard/custom-collection-services">Open custom services</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className="border-b p-4"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as CustomCollectionLeadStatus | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter custom collection leads by status"
              className="sm:w-[220px]"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === 'ALL' ? 'All statuses' : formatCustomCollectionStatus(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setStatus('ALL');
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
            <TableSkeleton columns={7} rows={6} />
          ) : query.isError ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">Failed to load custom service leads.</p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-medium">No leads found</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Try a different status filter.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: 'var(--border-default)' }}>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((lead) => (
                      <TableRow key={lead.id} style={{ borderColor: 'var(--border-default)' }}>
                        <TableCell>
                          <p className="font-medium">{lead.fullName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {lead.email} · {lead.phone}
                          </p>
                        </TableCell>
                        <TableCell>{lead.organization}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={formatCustomCollectionStatus(lead.status)}
                            semanticType={leadStatusSemantic(lead.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {lead.submissionType === 'SIGNED_IN_ONE_TAP' ? 'One-tap' : 'Guest form'}
                        </TableCell>
                        <TableCell>
                          v{lead.requestedRevisionVersion}
                          {lead.isRequestedRevisionCurrent
                            ? ''
                            : ` / current v${lead.currentRevisionVersion ?? '—'}`}
                        </TableCell>
                        <TableCell>{formatDateTime(lead.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/custom-collection-leads/${lead.id}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 p-3 md:hidden">
                {items.map((lead) => (
                  <LeadMobileCard key={lead.id} lead={lead} />
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
