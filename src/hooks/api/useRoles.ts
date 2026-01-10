/**
 * Roles API Hooks (Superadmin)
 * React Query hooks for role and permission management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as rolesService from '@/services/roles.service';
import type {
  RoleListParams,
  AdminRoleAuditParams,
  RolePermissionAuditParams,
} from '@/services/roles.service';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  ReplacePermissionsRequest,
  AddPermissionRequest,
  RemovePermissionRequest,
} from '@/types';

// ============================================
// Query Keys
// ============================================

export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (params: RoleListParams) => [...rolesKeys.lists(), params] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: string) => [...rolesKeys.details(), id] as const,
  permissions: (roleId: string) => [...rolesKeys.all, 'permissions', roleId] as const,
  allPermissions: () => [...rolesKeys.all, 'all-permissions'] as const,
  audit: {
    adminRoles: () => [...rolesKeys.all, 'audit', 'admin-roles'] as const,
    adminRolesList: (params: AdminRoleAuditParams) => [...rolesKeys.audit.adminRoles(), params] as const,
    rolePermissions: () => [...rolesKeys.all, 'audit', 'role-permissions'] as const,
    rolePermissionsList: (params: RolePermissionAuditParams) => [...rolesKeys.audit.rolePermissions(), params] as const,
  },
};

// ============================================
// Role Queries
// ============================================

export function useRoles(params: RoleListParams = {}) {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: () => rolesService.getRoles(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: rolesKeys.detail(roleId),
    queryFn: () => rolesService.getRoleById(roleId),
    enabled: !!roleId,
  });
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: rolesKeys.permissions(roleId),
    queryFn: () => rolesService.getRolePermissions(roleId),
    enabled: !!roleId,
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: rolesKeys.allPermissions(),
    queryFn: () => rolesService.getAllPermissions(),
    staleTime: 30 * 60 * 1000, // 30 minutes - permissions don't change often
  });
}

// ============================================
// Audit Queries
// ============================================

export function useAdminRoleAudit(params: AdminRoleAuditParams = {}) {
  return useQuery({
    queryKey: rolesKeys.audit.adminRolesList(params),
    queryFn: () => rolesService.getAdminRoleAudit(params),
  });
}

export function useRolePermissionAudit(params: RolePermissionAuditParams = {}) {
  return useQuery({
    queryKey: rolesKeys.audit.rolePermissionsList(params),
    queryFn: () => rolesService.getRolePermissionAudit(params),
  });
}

// ============================================
// Role Mutations
// ============================================

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      toast.success('Role created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleRequest }) =>
      rolesService.updateRole(roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId) });
      toast.success('Role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

// ============================================
// Permission Mutations
// ============================================

export function useReplaceRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: ReplacePermissionsRequest }) =>
      rolesService.replaceRolePermissions(roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(roleId) });
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId) });
      toast.success('Permissions updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update permissions');
    },
  });
}

export function useAddRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: AddPermissionRequest }) =>
      rolesService.addRolePermission(roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(roleId) });
      toast.success('Permission added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add permission');
    },
  });
}

export function useRemoveRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: RemovePermissionRequest }) =>
      rolesService.removeRolePermission(roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(roleId) });
      toast.success('Permission removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove permission');
    },
  });
}

// ============================================
// Admin Role Mutations
// ============================================

