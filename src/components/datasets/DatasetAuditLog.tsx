'use client';

import { useState } from 'react';
import { AlertCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  StatusBadge,
  formatStatusLabel,
  getDatasetStatusSemantic,
} from '@/components/shared/StatusBadge';
import { useDatasetAudit } from '@/hooks/api/useDatasets';

const formatAction = (action: string) =>
  action
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

export function DatasetAuditLog({ datasetId }: { datasetId: string }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const query = useDatasetAudit(datasetId, page, pageSize);
  const entries = query.data?.items ?? [];
  const total = query.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          Audit history {query.isLoading ? '' : `(${total})`}
        </CardTitle>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Recorded backend actions for this dataset, newest first.
        </p>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="space-y-3" aria-label="Loading audit history">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-[var(--bg-hover)]" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="flex flex-col items-center py-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <p className="mt-3 font-medium">Could not load audit history</p>
            <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center">
            <History
              className="mx-auto h-8 w-8"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <p className="mt-3 font-medium">No audit events recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatAction(entry.action)}
                    </p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                      by {entry.actor.name || entry.actor.email}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                    dateTime={entry.createdAt}
                  >
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </div>

                {entry.previousStatus || entry.newStatus ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {entry.previousStatus ? (
                      <StatusBadge
                        status={formatStatusLabel(entry.previousStatus)}
                        semanticType={getDatasetStatusSemantic(entry.previousStatus)}
                      />
                    ) : null}
                    {entry.previousStatus && entry.newStatus ? (
                      <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>
                        →
                      </span>
                    ) : null}
                    {entry.newStatus ? (
                      <StatusBadge
                        status={formatStatusLabel(entry.newStatus)}
                        semanticType={getDatasetStatusSemantic(entry.newStatus)}
                      />
                    ) : null}
                  </div>
                ) : null}

                {entry.summary ? (
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {entry.summary}
                  </p>
                ) : null}
              </article>
            ))}

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || query.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || query.isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
