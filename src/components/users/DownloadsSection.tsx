/**
 * DownloadsSection - Downloads activity with collapsible details
 */

"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Download } from '@/types/user.types';
import { formatDateTime } from '@/utils/date.utils';
import { EMPTY_MESSAGES } from '@/constants/user.constants';

interface DownloadsSectionProps {
  downloads: Download[];
}

export function DownloadsSection({ downloads }: DownloadsSectionProps) {
  const [expandedDownload, setExpandedDownload] = useState<string | null>(null);

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
          Downloads Activity
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            ({downloads.length})
          </span>
        </h2>
      </div>

      {downloads.length === 0 ? (
        <div className="p-12 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            {EMPTY_MESSAGES.NO_DOWNLOADS}
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {downloads.map((download) => (
            <div key={download.id}>
              <button
                onClick={() =>
                  setExpandedDownload(expandedDownload === download.id ? null : download.id)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {download.datasetName}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(download.downloadedAt)}
                  </p>
                </div>
                {expandedDownload === download.id ? (
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              {expandedDownload === download.id && (
                <div
                  className="px-6 pb-4 space-y-2"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Dataset ID
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {download.datasetId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        IP Address
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {download.ipAddress || '—'}
                      </p>
                    </div>
                  </div>
                  {download.userAgent && (
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        User Agent
                      </p>
                      <p className="text-xs mt-1 break-all" style={{ color: 'var(--text-muted)' }}>
                        {download.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
