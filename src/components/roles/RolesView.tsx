"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleFilters } from "./RoleFilters";
import { RoleTable } from "./RoleTable";
import { CreateRoleDialog, EditRoleDialog, ManagePermissionsDialog } from "./RoleDialogs";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useRolePermissions,
  useReplaceRolePermissions,
  useAllPermissions,
  useMyPermissions,
} from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import type { RoleListItem, CreateRoleRequest, UpdateRoleRequest } from "@/types";

export function RolesView() {
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page when filters change
   
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Build API params
  const params = useMemo(() => ({
    page,
    pageSize: limit,
    q: debouncedSearch || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [page, limit, debouncedSearch, statusFilter]);

  // Fetch roles
  const { data, isLoading, isError } = useRoles(params);
  const roles = data?.items || [];
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / data.pagination.pageSize) : 0;

  // Fetch all available permissions
  const { data: allPermissions, isLoading: permissionsLoading } = useAllPermissions();

  // Fetch selected role's current permissions
  const { data: rolePermissions } = useRolePermissions(selectedRole?.id || "");

  // Permissions check
  const { data: myPermissions } = useMyPermissions();
  const canManageRoles = myPermissions?.includes('MANAGE_PERMISSIONS') || myPermissions?.includes('MANAGE_ROLES') || myPermissions?.includes('CREATE_ADMIN') || false;

  // Mutations
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const replacePermissionsMutation = useReplaceRolePermissions();

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
  }, []);

  const handleCreateRole = useCallback((data: CreateRoleRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  }, [createMutation]);

  const handleEditClick = useCallback((role: RoleListItem) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  }, []);

  const handleEditRole = useCallback((data: UpdateRoleRequest) => {
    if (!selectedRole) return;
    updateMutation.mutate(
      { roleId: selectedRole.id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedRole(null);
        },
      }
    );
  }, [selectedRole, updateMutation]);

  const handleManagePermissionsClick = useCallback((role: RoleListItem) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  }, []);

  const handleSavePermissions = useCallback((permissions: string[]) => {
    if (!selectedRole) return;
    replacePermissionsMutation.mutate(
      { roleId: selectedRole.id, data: { permissions } },
      {
        onSuccess: () => {
          setPermissionsDialogOpen(false);
          setSelectedRole(null);
        },
      }
    );
  }, [selectedRole, replacePermissionsMutation]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Page Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Roles
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Manage roles and their permissions
            </p>
          </div>
          {canManageRoles && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "#ffffff",
              }}
            >
              <Plus className="w-4 h-4" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <RoleFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      <div className="p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-base)",
            borderColor: "var(--border-default)",
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Failed to load roles. Please try again.</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                No roles found
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {debouncedSearch || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first role"}
              </p>
              {(debouncedSearch || statusFilter !== "all") && (
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <RoleTable
              roles={roles}
              onEdit={handleEditClick}
              onManagePermissions={handleManagePermissionsClick}
              canManageRoles={canManageRoles}
            />
          )}
        </div>

        {/* Pagination */}
        {!isLoading && roles.length > 0 && data?.pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} roles
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateRole}
        isLoading={createMutation.isPending}
        allPermissions={allPermissions || []}
        permissionsLoading={permissionsLoading}
      />

      <EditRoleDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedRole(null);
        }}
        onSubmit={handleEditRole}
        isLoading={updateMutation.isPending}
        role={selectedRole}
      />

      <ManagePermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        onSubmit={handleSavePermissions}
        isLoading={replacePermissionsMutation.isPending}
        role={selectedRole}
        currentPermissions={rolePermissions || []}
        allPermissions={allPermissions || []}
        permissionsLoading={permissionsLoading}
      />
    </div>
  );
}
