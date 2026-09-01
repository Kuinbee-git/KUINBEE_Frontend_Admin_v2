'use client';

import { DataTable, ColumnDef, ActionButton } from '@/components/shared/DataTable';
import type { Category } from '@/types';

interface CategoryTableProps {
  categories: Category[];
  onRowClick: (category: Category) => void;
  onDeleteClick: (category: Category, e: React.MouseEvent) => void;
  canDelete: boolean;
}

export function CategoryTable({
  categories,
  onRowClick,
  onDeleteClick,
  canDelete,
}: CategoryTableProps) {
  const columns: ColumnDef<Category>[] = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (category) => (
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {category.name}
        </span>
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
      header: 'Created By',
      render: (category) => (
        <div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {category.createdByUser?.name || 'Admin unavailable'}
          </p>
          {category.createdByUser?.email ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {category.createdByUser.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
      render: (category) => (
        <span className="text-sm">
          {new Date(category.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const actions: ActionButton<Category>[] = canDelete
    ? [
        {
          label: 'Delete',
          onClick: onDeleteClick,
          variant: 'danger',
        },
      ]
    : [];

  return (
    <DataTable
      columns={columns}
      data={categories}
      onRowClick={onRowClick}
      actions={actions}
      getRowKey={(category) => category.id}
      emptyMessage="No categories found"
      ariaLabel="Categories"
      getRowLabel={(category) => `Edit category ${category.name}`}
    />
  );
}
