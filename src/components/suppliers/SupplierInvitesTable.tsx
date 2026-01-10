"use client";

import { Building2, User, Mail, RefreshCw, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SupplierInvite } from "@/types";

interface SupplierInvitesTableProps {
  invites: SupplierInvite[];
  onResend: (invite: SupplierInvite) => void;
}

export function SupplierInvitesTable({ invites, onResend }: SupplierInvitesTableProps) {
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
          <TableHead style={{ color: "var(--text-muted)" }}>Type</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Name</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Sent Date</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Send Count</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.id} style={{ borderColor: "var(--border-default)" }}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-primary)" }}>{invite.email}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  invite.supplierInviteType === "COMPANY"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                }
              >
                {invite.supplierInviteType === "COMPANY" ? (
                  <Building2 className="w-3 h-3 mr-1" />
                ) : (
                  <User className="w-3 h-3 mr-1" />
                )}
                {invite.supplierInviteType}
              </Badge>
            </TableCell>
            <TableCell style={{ color: "var(--text-primary)" }}>
              {invite.supplierInviteType === "INDIVIDUAL"
                ? invite.individualName
                : invite.companyName}
              {invite.supplierInviteType === "COMPANY" && invite.contactPersonName && (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Contact: {invite.contactPersonName}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(invite.sentAt).toLocaleDateString()}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">
                {invite.sendCount} {invite.sendCount === 1 ? "time" : "times"}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResend(invite)}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resend
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
