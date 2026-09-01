'use client';

import {
  StatusBadge,
  getDatasetStatusSemantic,
  formatStatusLabel,
} from '@/components/shared/StatusBadge';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import type { DatasetListItem, DatasetStatus, DatasetVisibility } from '@/types/dataset.types';
import { VisibilityCell } from './VisibilityCell';

interface DatasetTableProps {
  datasets: DatasetListItem[];
  onRowClick: (datasetId: string) => void;
  onVisibilityChange: (datasetId: string, visibility: DatasetVisibility) => Promise<void>;
  canUpdateVisibility: boolean;
}

export function DatasetTable({
  datasets,
  onRowClick,
  onVisibilityChange,
  canUpdateVisibility,
}: DatasetTableProps) {
  const baseColumns: ColumnDef<DatasetListItem>[] = [
    {
      header: 'Dataset',
      accessor: 'dataset',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {row.dataset.title}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {row.dataset.datasetUniqueId}
          </span>
        </div>
      ),
    },
  ];

  const remainingColumns: ColumnDef<DatasetListItem>[] = [
    {
      header: 'Category',
      accessor: 'primaryCategory',
      render: (row) => <span className="text-sm">{row.primaryCategory?.name ?? 'N/A'}</span>,
    },
    {
      header: 'Source',
      accessor: 'source',
      render: (row) => <span className="text-sm">{row.source?.name ?? 'N/A'}</span>,
    },
    {
      header: 'Status',
      accessor: 'dataset',
      render: (row) => (
        <StatusBadge
          status={formatStatusLabel(row.dataset.status as DatasetStatus)}
          semanticType={getDatasetStatusSemantic(row.dataset.status as DatasetStatus)}
        />
      ),
    },
    {
      header: 'Visibility',
      accessor: 'dataset',
      render: (row) => (
        <VisibilityCell
          datasetId={row.dataset.id}
          visibility={row.dataset.visibility}
          onVisibilityChange={onVisibilityChange}
          canEdit={canUpdateVisibility && row.dataset.ownerType === 'PLATFORM'}
        />
      ),
    },
    {
      header: 'Last Updated',
      accessor: 'dataset',
      render: (row) => (
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {new Date(row.dataset.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const columns = [...baseColumns, ...remainingColumns];

  return (
    <DataTable
      columns={columns}
      data={datasets}
      onRowClick={(dataset) => onRowClick(dataset.dataset.id)}
      getRowKey={(dataset) => dataset.dataset.id}
      emptyMessage="No datasets found"
      ariaLabel="Datasets"
      getRowLabel={(dataset) => `Open dataset ${dataset.dataset.title}`}
    />
  );
}
