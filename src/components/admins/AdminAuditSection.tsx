/**
 * AdminAuditSection - Admin audit log awareness
 */
"use client";
import React from 'react';
import { Clock, FileText } from 'lucide-react';
import { formatDateTime } from '@/utils/date.utils';
import type { AdminAuditLog } from '@/types/admin.types';

interface AdminAuditSectionProps {
  auditLogs: AdminAuditLog[];
  lastPermissionChange?: string;
  permissionChangedBy?: string;
}

export function AdminAuditSection({
  auditLogs,
  lastPermissionChange,
  permissionChangedBy,
}: AdminAuditSectionProps) {
  const recentLogs = auditLogs.slice(0, 5);

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Audit Awareness
      </h3>

      {/* Last Permission Change */}
      {lastPermissionChange && (
        <div
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Last Permission Change
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {formatDateTime(lastPermissionChange)} by {permissionChangedBy}
          </p>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
          Recent Activity (Last 5 Actions)
        </h4>
        
        {recentLogs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <FileText className="w-4 h-4 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {log.action}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {log.targetType}: <span style={{ color: 'var(--text-primary)' }}>{log.targetName}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
