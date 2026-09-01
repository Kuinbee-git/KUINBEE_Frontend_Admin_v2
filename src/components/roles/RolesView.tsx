'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleFilters } from './RoleFilters';
import { RoleTable } from './RoleTable';
import { CreateRoleDialog, EditRoleDialog, ManagePermissionsDialog } from './RoleDialogs';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useRolePermissions,
  useReplaceRolePermissions,
  useAllPermissions,
} from '@/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import type { RoleListItem, CreateRoleRequest, UpdateRoleRequest } from '@/types';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS, type Permission } from '@/lib/constants/permissions';

export function RolesView() {
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Build API params
  const params = useMemo(
    () => ({
      page,
      pageSize: limit,
      q: debouncedSearch || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [page, limit, debouncedSearch, statusFilter]
  );

  // Fetch roles
  const { data, isLoading, isError, refetch } = useRoles(params);
  const roles = data?.items || [];
  const totalPages = data?.pagination
    ? Math.ceil(data.pagination.total / data.pagination.pageSize)
    : 0;

  // Fetch all available permissions
  const {
    data: allPermissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch: refetchAllPermissions,
  } = useAllPermissions();

  // Fetch selected role's current permissions
  const {
    data: rolePermissions,
    isLoading: rolePermissionsLoading,
    isFetching: rolePermissionsFetching,
    isError: rolePermissionsError,
    refetch: refetchRolePermissions,
  } = useRolePermissions(selectedRole?.id || '');

  // Permissions check
  const { can } = useAuthorization();
  const canManageRoles = can({ anyOf: [PERMISSIONS.ROLES.MANAGE] });

  // Mutations
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const replacePermissionsMutation = useReplaceRolePermissions();

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  }, []);

  const handleCreateRole = useCallback(
    (data: CreateRoleRequest) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setCreateDialogOpen(false);
        },
      });
    },
    [createMutation]
  );

  const handleEditClick = useCallback((role: RoleListItem) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  }, []);

  const handleEditRole = useCallback(
    (data: UpdateRoleRequest) => {
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
    },
    [selectedRole, updateMutation]
  );

  const handleManagePermissionsClick = useCallback((role: RoleListItem) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  }, []);

  const handleSavePermissions = useCallback(
    (permissions: Permission[]) => {
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
    },
    [selectedRole, replacePermissionsMutation]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <PageHeader
        title="Roles"
        description="Manage roles and their permissions"
        actions={
          canManageRoles ? (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Role
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <RoleFilters
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onClearAll={handleClearFilters}
      />

      {/* Table */}
      <div className="p-4 sm:p-6">
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-[var(--status-error)]">Failed to load roles. Please try again.</p>
              <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No roles found
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {debouncedSearch || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first role'}
              </p>
              {(debouncedSearch || statusFilter !== 'all') && (
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of{' '}
              {data.pagination.total} roles
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
      {createDialogOpen && (
        <CreateRoleDialog
          open
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateRole}
          isLoading={createMutation.isPending}
          allPermissions={allPermissions || []}
          permissionsLoading={permissionsLoading}
          permissionsError={permissionsError}
          onRetryPermissions={() => refetchAllPermissions()}
        />
      )}

      {editDialogOpen && selectedRole && (
        <EditRoleDialog
          key={selectedRole.id}
          open
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedRole(null);
          }}
          onSubmit={handleEditRole}
          isLoading={updateMutation.isPending}
          role={selectedRole}
        />
      )}

      {permissionsDialogOpen &&
        selectedRole &&
        !permissionsLoading &&
        !rolePermissionsLoading &&
        !rolePermissionsFetching && (
          <ManagePermissionsDialog
            key={selectedRole.id}
            open
            onOpenChange={(open) => {
              setPermissionsDialogOpen(open);
              if (!open) setSelectedRole(null);
            }}
            onSubmit={handleSavePermissions}
            isLoading={replacePermissionsMutation.isPending}
            role={selectedRole}
            currentPermissions={rolePermissions || []}
            allPermissions={allPermissions || []}
            permissionsLoading={false}
            permissionsError={permissionsError || rolePermissionsError}
            onRetryPermissions={() => {
              void refetchAllPermissions();
              void refetchRolePermissions();
            }}
          />
        )}
    </div>
  );
}
