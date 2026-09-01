'use client';

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatEnumLabel, StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable, ColumnDef, ActionButton } from '@/components/shared/DataTable';
import type { Source } from '@/types';
import { getSafeHttpUrl } from '@/lib/utils/url.utils';

interface SourceTableProps {
  sources: Source[];
  onRowClick: (source: Source) => void;
  onVerifyClick: (source: Source, e: React.MouseEvent) => void;
  onDeleteClick: (source: Source, e: React.MouseEvent) => void;
  canVerify: boolean;
  canDelete: boolean;
}

export function SourceTable({
  sources,
  onRowClick,
  onVerifyClick,
  onDeleteClick,
  canVerify,
  canDelete,
}: SourceTableProps) {
  const columns: ColumnDef<Source>[] = [
    {
      header: 'Source Name',
      accessor: (row) => ({ name: row.name, url: row.websiteUrl }),
      render: (source) => {
        const safeUrl = getSafeHttpUrl(source.websiteUrl);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {source.name}
            </span>
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex"
                aria-label={`Open ${source.name} website in a new tab`}
              >
                <ExternalLink
                  aria-hidden="true"
                  className="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </a>
            )}
          </div>
        );
      },
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (source) =>
        source.description ? (
          <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {source.description}
          </p>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            —
          </span>
        ),
    },
    {
      header: 'Created By Type',
      accessor: 'createdByType',
      render: (source) => (
        <Badge
          style={
            source.createdByType === 'PLATFORM'
              ? {
                  backgroundColor: 'var(--status-info-bg)',
                  color: 'var(--status-info)',
                  border: '1px solid var(--status-info-border)',
                }
              : {
                  backgroundColor: 'var(--status-in-progress-bg)',
                  color: 'var(--status-in-progress)',
                  border: '1px solid var(--status-in-progress-border)',
                }
          }
        >
          {formatEnumLabel(source.createdByType)}
        </Badge>
      ),
    },
    {
      header: 'Verification',
      accessor: 'isVerified',
      render: (source) => (
        <StatusBadge
          status={source.isVerified ? 'Verified' : 'Unverified'}
          semanticType={source.isVerified ? 'success' : 'neutral'}
        />
      ),
    },
    {
      header: 'Datasets Count',
      accessor: 'datasetCount',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {row.datasetCount || 0}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
      render: (source) => (
        <span className="text-sm">
          {new Date(source.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const actions: ActionButton<Source>[] = [
    ...(canVerify
      ? [
          {
            label: 'Verify',
            onClick: onVerifyClick,
            variant: 'success',
            show: (source) => source.createdByType === 'PLATFORM' && !source.isVerified,
          } satisfies ActionButton<Source>,
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Delete',
            onClick: onDeleteClick,
            variant: 'danger',
            show: (source) => source.createdByType === 'PLATFORM',
          } satisfies ActionButton<Source>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={sources}
      onRowClick={onRowClick}
      actions={actions}
      getRowKey={(source) => source.id}
      emptyMessage="No sources found"
      ariaLabel="Sources"
      getRowLabel={(source) => `Edit source ${source.name}`}
    />
  );
}
