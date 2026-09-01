'use client';

import { ReactNode } from 'react';

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T | ((row: T) => unknown);
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface ActionButton<T> {
  label: string;
  onClick: (row: T, e: React.MouseEvent) => void;
  variant?: 'default' | 'success' | 'danger';
  show?: (row: T) => boolean;
  icon?: ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  actions?: ActionButton<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  rowClassName?: string;
  ariaLabel?: string;
  getRowLabel?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  actions,
  getRowKey,
  emptyMessage = 'No data available',
  rowClassName,
  ariaLabel = 'Data table',
  getRowLabel,
}: DataTableProps<T>) {
  const hasActions = actions && actions.length > 0;

  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    if (column.accessor) {
      return row[column.accessor];
    }
    return null;
  };

  return (
    <div className="w-full overflow-x-auto" role="region" aria-label={ariaLabel} tabIndex={0}>
      <table className="w-full min-w-max">
        <thead>
          <tr
            className="border-b"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                } ${column.className || ''}`}
                style={{ color: 'var(--text-muted)' }}
              >
                {column.header}
              </th>
            ))}
            {hasActions && (
              <th
                className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="px-4 py-8 text-center text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                className={`border-b transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[var(--bg-hover)] focus-visible:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]'
                    : ''
                } ${rowClassName || ''}`}
                style={{
                  borderColor: 'var(--border-subtle)',
                }}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'link' : undefined}
                aria-label={onRowClick ? getRowLabel?.(row) : undefined}
                onKeyDown={(event) => {
                  if (
                    !onRowClick ||
                    event.target !== event.currentTarget ||
                    (event.key !== 'Enter' && event.key !== ' ')
                  ) {
                    return;
                  }
                  event.preventDefault();
                  onRowClick(row);
                }}
              >
                {columns.map((column, idx) => {
                  const value = getCellValue(row, column);
                  const content = column.render ? column.render(row) : (value as ReactNode);

                  return (
                    <td
                      key={idx}
                      className={`px-4 py-4 text-sm ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                      }`}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {content}
                    </td>
                  );
                })}
                {hasActions && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actions
                        .filter((action) => (action.show ? action.show(row) : true))
                        .map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, e);
                            }}
                            type="button"
                            className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                              action.variant === 'danger'
                                ? 'hover:bg-[var(--status-error)] hover:text-[var(--bg-base)]'
                                : action.variant === 'success'
                                  ? 'hover:bg-[var(--status-success)] hover:text-[var(--bg-base)]'
                                  : 'hover:bg-[var(--bg-hover)]'
                            }`}
                            style={
                              action.variant === 'danger'
                                ? {
                                    borderColor: 'var(--status-error)',
                                    color: 'var(--status-error)',
                                  }
                                : action.variant === 'success'
                                  ? {
                                      borderColor: 'var(--status-success)',
                                      color: 'var(--status-success)',
                                    }
                                  : {
                                      borderColor: 'var(--border-default)',
                                      color: 'var(--text-secondary)',
                                    }
                            }
                          >
                            {action.icon && (
                              <span className="inline-flex items-center gap-1">
                                {action.icon}
                                {action.label}
                              </span>
                            )}
                            {!action.icon && action.label}
                          </button>
                        ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
