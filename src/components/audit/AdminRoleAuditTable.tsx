"use client";

import { UserPlus, UserMinus, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminRoleAuditEntry, AdminRoleAuditEventType } from "@/types";

interface AdminRoleAuditTableProps {
  logs: AdminRoleAuditEntry[];
}

function getEventBadge(eventType: AdminRoleAuditEventType) {
  const config: Record<
    AdminRoleAuditEventType,
    { label: string; className: string; icon: typeof UserPlus }
  > = {
    ASSIGNED: {
      label: "Assigned",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: UserPlus,
    },
    REVOKED: {
      label: "Revoked",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: UserMinus,
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

export function AdminRoleAuditTable({ logs }: AdminRoleAuditTableProps) {
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
          <TableHead style={{ color: "var(--text-muted)" }}>Admin</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Role</TableHead>
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
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {log.admin.email}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ID: {log.admin.id.substring(0, 8)}...
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {log.role.displayName}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {log.role.name}
                  </span>
                </div>
              </div>
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
