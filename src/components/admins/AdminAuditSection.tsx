/**
 * AdminAuditSection - Admin audit log awareness
 */
'use client';
import { FileText } from 'lucide-react';
import { formatDateTime } from '@/utils/date.utils';
import type { AdminRoleAuditEntry } from '@/types/role.types';

interface AdminAuditSectionProps {
  auditLogs: AdminRoleAuditEntry[];
}

export function AdminAuditSection({ auditLogs }: AdminAuditSectionProps) {
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
        Role assignment activity
      </h3>

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
          Recent role changes
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
                      {log.eventType === 'ASSIGNED' ? 'Role assigned' : 'Role revoked'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{log.role.displayName}</span>
                    {' by '}
                    {log.actor.name || log.actor.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
