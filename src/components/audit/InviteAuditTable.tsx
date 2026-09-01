'use client';

import { Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InviteAuditEntry, InviteAuditEventType } from '@/types';

interface InviteAuditTableProps {
  logs: InviteAuditEntry[];
}

function getEventBadge(eventType: InviteAuditEventType) {
  const config: Record<
    InviteAuditEventType,
    { label: string; className: string; icon: typeof Clock }
  > = {
    CREATED: {
      label: 'Created',
      className:
        'bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info-border)]',
      icon: CheckCircle,
    },
    RESENT: {
      label: 'Resent',
      className:
        'bg-[var(--status-in-progress-bg)] text-[var(--status-in-progress)] border-[var(--status-in-progress-border)]',
      icon: Mail,
    },
    CANCELLED: {
      label: 'Cancelled',
      className:
        'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]',
      icon: XCircle,
    },
    USED: {
      label: 'Used',
      className:
        'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]',
      icon: CheckCircle,
    },
  };

  const { label, className, icon: Icon } = config[eventType];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

export function InviteAuditTable({ logs }: InviteAuditTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <TableHead style={{ color: 'var(--text-muted)' }}>Timestamp</TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>Event</TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>Invite Email</TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>Actor</TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>Metadata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id} style={{ borderColor: 'var(--border-default)' }}>
            <TableCell style={{ color: 'var(--text-muted)' }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm">{new Date(log.createdAt).toLocaleDateString()}</span>
                <span className="text-xs opacity-70">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </TableCell>
            <TableCell>{getEventBadge(log.eventType)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{log.inviteEmail}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {log.actor.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {log.actor.email}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                <details className="cursor-pointer">
                  <summary className="text-xs text-[var(--status-info)]">View metadata</summary>
                  <pre
                    className="text-xs mt-2 p-2 rounded"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  None
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
