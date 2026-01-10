"use client";

import { Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InviteAuditEntry, InviteAuditEventType } from "@/types";

interface InviteAuditTableProps {
  logs: InviteAuditEntry[];
}

function getEventBadge(eventType: InviteAuditEventType) {
  const config: Record<
    InviteAuditEventType,
    { label: string; className: string; icon: typeof Clock }
  > = {
    CREATED: {
      label: "Created",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: CheckCircle,
    },
    RESENT: {
      label: "Resent",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      icon: Mail,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: XCircle,
    },
    USED: {
      label: "Used",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
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
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <TableHead style={{ color: "var(--text-muted)" }}>Timestamp</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Event</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Invite Email</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Invite ID</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Actor</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Metadata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id} style={{ borderColor: "var(--border-default)" }}>
            <TableCell style={{ color: "var(--text-muted)" }}>
              <div className="flex flex-col gap-1">
                <span className="text-sm">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs opacity-70">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </TableCell>
            <TableCell>{getEventBadge(log.eventType)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-primary)" }}>{log.inviteEmail}</span>
              </div>
            </TableCell>
            <TableCell>
              <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "var(--bg-surface)" }}>
                {log.inviteId.substring(0, 8)}...
              </code>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {log.actor.email}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ID: {log.actor.id.substring(0, 8)}...
                </span>
              </div>
            </TableCell>
            <TableCell>
              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                <details className="cursor-pointer">
                  <summary className="text-xs text-blue-600 dark:text-blue-400">
                    View metadata
                  </summary>
                  <pre className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: "var(--bg-surface)" }}>
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
