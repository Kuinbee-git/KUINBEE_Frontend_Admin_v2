/**
 * AuditSection - Audit log summary
 */

"use client";

import React from 'react';
import { AuditLogEntry } from '@/types/user.types';
import { formatDateTime } from '@/utils/date.utils';
import { EMPTY_MESSAGES } from '@/constants/user.constants';

interface AuditSectionProps {
  auditLog: AuditLogEntry[];
}

export function AuditSection({ auditLog }: AuditSectionProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <h2 className="mb-4" style={{ color: 'var(--text-primary)' }}>
        Audit Summary
      </h2>

      {auditLog.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          {EMPTY_MESSAGES.NO_AUDIT_LOGS}
        </p>
      ) : (
        <div className="space-y-3">
          {auditLog.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="pb-3 border-b last:border-b-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {entry.action}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    By {entry.performedBy} • {formatDateTime(entry.timestamp)}
                  </p>
                  {entry.reason && (
                    <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {entry.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
