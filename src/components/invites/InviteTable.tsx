"use client";

import { MoreHorizontal, Mail, XCircle, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Invite, InviteStatus } from "@/types";

interface InviteTableProps {
  invites: Invite[];
  onResend: (invite: Invite) => void;
  onCancel: (invite: Invite) => void;
  onViewDetails: (invite: Invite) => void;
  canManageInvites: boolean;
}

function getStatusBadge(status: InviteStatus) {
  const config: Record<InviteStatus, { label: string; className: string; icon: typeof Clock }> = {
    ACTIVE: {
      label: "Active",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: Clock,
    },
    USED: {
      label: "Used",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: XCircle,
    },
    EXPIRED: {
      label: "Expired",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

function getInviteStatus(invite: Invite): InviteStatus {
  if (invite.usedAt) return "USED";
  if (invite.cancelledAt) return "CANCELLED";
  if (new Date(invite.expiresAt) < new Date()) return "EXPIRED";
  return "ACTIVE";
}

function canPerformAction(invite: Invite): boolean {
  return !invite.usedAt && !invite.cancelledAt && new Date(invite.expiresAt) >= new Date();
}

export function InviteTable({
  invites,
  onResend,
  onCancel,
  onViewDetails,
  canManageInvites,
}: InviteTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <TableHead style={{ color: "var(--text-muted)" }}>Email</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Roles</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Status</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Expires</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Sent</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Resends</TableHead>
          {canManageInvites && (
            <TableHead className="w-15" style={{ color: "var(--text-muted)" }}>
              Actions
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => {
          const status = getInviteStatus(invite);
          const canAct = canPerformAction(invite);

          return (
            <TableRow
              key={invite.id}
              style={{ borderColor: "var(--border-default)" }}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <button
                    onClick={() => onViewDetails(invite)}
                    className="hover:underline cursor-pointer text-left"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {invite.email}
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {invite.roles.map((role) => (
                    <Badge
                      key={role.roleId}
                      variant="secondary"
                      className="text-xs"
                    >
                      {role.displayName || role.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(status)}</TableCell>
              <TableCell style={{ color: "var(--text-muted)" }}>
                {new Date(invite.expiresAt).toLocaleDateString()}
              </TableCell>
              <TableCell style={{ color: "var(--text-muted)" }}>
                {invite.lastSentAt
                  ? new Date(invite.lastSentAt).toLocaleDateString()
                  : new Date(invite.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell style={{ color: "var(--text-muted)" }}>
                {invite.resendCount}
              </TableCell>
              {canManageInvites && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={!canAct}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onViewDetails(invite)}
                        disabled={!canAct}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResend(invite)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Invite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCancel(invite)}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Invite
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
