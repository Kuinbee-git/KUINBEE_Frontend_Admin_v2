"use client";

import { MoreHorizontal, Edit, Key, CheckCircle, XCircle } from "lucide-react";
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
import type { RoleListItem } from "@/types";

interface RoleTableProps {
  roles: RoleListItem[];
  onEdit: (role: RoleListItem) => void;
  onManagePermissions: (role: RoleListItem) => void;
  canManageRoles: boolean;
}

export function RoleTable({
  roles,
  onEdit,
  onManagePermissions,
  canManageRoles,
}: RoleTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <TableHead style={{ color: "var(--text-muted)" }}>Name</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Display Name</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Description</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Permissions</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Status</TableHead>
          <TableHead style={{ color: "var(--text-muted)" }}>Created</TableHead>
          {canManageRoles && (
            <TableHead className="w-[60px]" style={{ color: "var(--text-muted)" }}>
              Actions
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow
            key={role.id}
            style={{ borderColor: "var(--border-default)" }}
          >
            <TableCell>
              <code
                className="px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                {role.name}
              </code>
            </TableCell>
            <TableCell style={{ color: "var(--text-primary)" }}>
              {role.displayName}
            </TableCell>
            <TableCell
              className="max-w-[200px] truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {role.description || "—"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="gap-1">
                <Key className="w-3 h-3" />
                {role.permissionCount}
              </Badge>
            </TableCell>
            <TableCell>
              {role.isActive ? (
                <Badge
                  variant="outline"
                  className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                >
                  <CheckCircle className="w-3 h-3" />
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                >
                  <XCircle className="w-3 h-3" />
                  Inactive
                </Badge>
              )}
            </TableCell>
            <TableCell style={{ color: "var(--text-muted)" }}>
              {new Date(role.createdAt).toLocaleDateString()}
            </TableCell>
            {canManageRoles && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(role)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onManagePermissions(role)}>
                      <Key className="mr-2 h-4 w-4" />
                      Manage Permissions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
