"use client";

import { Mail, Calendar, Clock, User, Shield, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Invite, InviteStatus } from "@/types";

interface InviteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invite: Invite | null;
  onResend?: (invite: Invite) => void;
  onCancel?: (invite: Invite) => void;
  canManageInvites: boolean;
}

function getStatusBadge(status: InviteStatus) {
  const config: Record<InviteStatus, { label: string; className: string }> = {
    ACTIVE: {
      label: "Active",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    USED: {
      label: "Used",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    EXPIRED: {
      label: "Expired",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
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

export function InviteDetailDialog({
  open,
  onOpenChange,
  invite,
  onResend,
  onCancel,
  canManageInvites,
}: InviteDetailDialogProps) {
  if (!invite) return null;

  const status = getInviteStatus(invite);
  const canAct = canPerformAction(invite);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Details
          </DialogTitle>
          <DialogDescription>
            View complete information about this admin invitation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email & Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                Email Address
              </p>
              <p className="text-lg font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                {invite.email}
              </p>
            </div>
            <div>{getStatusBadge(status)}</div>
          </div>

          {/* Assigned Roles */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              <Shield className="w-4 h-4 inline mr-1" />
              Assigned Roles
            </p>
            <div className="flex flex-wrap gap-2">
              {invite.roles.length > 0 ? (
                invite.roles.map((role) => (
                  <Badge
                    key={role.roleId}
                    variant="secondary"
                    className="text-sm"
                  >
                    {role.displayName || role.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No roles assigned
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div
            className="grid grid-cols-2 gap-4 p-4 rounded-lg border"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            }}
          >
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                <Calendar className="w-3 h-3 inline mr-1" />
                Created
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {new Date(invite.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                <Clock className="w-3 h-3 inline mr-1" />
                Expires
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {new Date(invite.expiresAt).toLocaleString()}
              </p>
            </div>

            {invite.lastSentAt && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  <Mail className="w-3 h-3 inline mr-1" />
                  Last Sent
                </p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {new Date(invite.lastSentAt).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Resend Count
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {invite.resendCount} time(s)
              </p>
            </div>

            {invite.usedAt && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  Used At
                </p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {new Date(invite.usedAt).toLocaleString()}
                </p>
              </div>
            )}

            {invite.cancelledAt && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  Cancelled At
                </p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {new Date(invite.cancelledAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              <User className="w-4 h-4 inline mr-1" />
              Created By
            </p>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {invite.createdBy}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {(!canManageInvites || !canAct) ? (
            <div className="flex flex-row w-full justify-center items-center mt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-w-[90px]"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="flex flex-row gap-3 w-full justify-end items-center mt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-w-[90px]"
              >
                Close
              </Button>
              {onResend && (
                <Button
                  onClick={() => {
                    onResend(invite);
                    onOpenChange(false);
                  }}
                  variant="secondary"
                  className="gap-2 min-w-[90px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend
                </Button>
              )}
              {onCancel && (
                <Button
                  onClick={() => {
                    onCancel(invite);
                    onOpenChange(false);
                  }}
                  variant="destructive"
                  className="gap-2 min-w-[120px]"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Invite
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
