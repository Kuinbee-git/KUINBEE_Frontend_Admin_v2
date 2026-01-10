/**
 * DatasetAccessSection - Dataset access list with visual badges
 */

"use client";

import React from 'react';
import { Eye } from 'lucide-react';
import { DatasetAccess } from '@/types/user.types';
import { getAccessTypeInfo, getAccessTypeLabel } from '@/utils/status.utils';
import { formatDateTime } from '@/utils/date.utils';
import { EMPTY_MESSAGES } from '@/constants/user.constants';

interface DatasetAccessSectionProps {
  datasetAccess: DatasetAccess[];
  onDatasetClick?: (datasetId: string) => void;
}

export function DatasetAccessSection({
  datasetAccess,
  onDatasetClick,
}: DatasetAccessSectionProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="p-6 pb-4">
        <h2 style={{ color: 'var(--text-primary)' }}>
          Dataset Access
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            ({datasetAccess.length})
          </span>
        </h2>
      </div>

      {datasetAccess.length === 0 ? (
        <div className="p-12 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            {EMPTY_MESSAGES.NO_DATASET_ACCESS}
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr
              className="border-b"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
              }}
            >
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Dataset
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Access Type
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Granted
              </th>
              <th
                className="text-left px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Expires
              </th>
              <th
                className="text-center px-6 py-3 text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {datasetAccess.map((access) => {
              const typeInfo = getAccessTypeInfo(access.accessType);
              return (
                <tr
                  key={access.id}
                  className="border-b"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {access.datasetName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {access.datasetId}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs"
                      style={{
                        backgroundColor: typeInfo.bg,
                        color: typeInfo.color,
                        border: `1px solid ${typeInfo.border}`,
                      }}
                    >
                      {getAccessTypeLabel(access.accessType)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDateTime(access.grantedAt)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {access.expiresAt ? formatDateTime(access.expiresAt) : 'Never'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {onDatasetClick && (
                      <button
                        onClick={() => onDatasetClick(access.datasetId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-hover)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
