/**
 * Admins API Hooks
 * React Query hooks for admin management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as adminsService from '@/services/admins.service';
import type { AdminListParams } from '@/services/admins.service';
import type { DeleteAdminRequest, UpdateAdminRequest, UpdateAdminRolesRequest } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

// ============================================
// Query Keys
// ============================================

const adminsKeys = {
  all: ['admins'] as const,
  lists: () => [...adminsKeys.all, 'list'] as const,
  list: (params: AdminListParams) => [...adminsKeys.lists(), params] as const,
  details: () => [...adminsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminsKeys.details(), id] as const,
  roles: (id: string) => [...adminsKeys.all, 'roles', id] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Get paginated list of admins
 */
export function useAdmins(params: AdminListParams = {}) {
  return useQuery({
    queryKey: adminsKeys.list(params),
    queryFn: () => adminsService.getAdmins(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Get admin detail by ID
 */
export function useAdmin(adminId: string) {
  return useQuery({
    queryKey: adminsKeys.detail(adminId),
    queryFn: () => adminsService.getAdminById(adminId),
    enabled: !!adminId,
  });
}

/**
 * Get admin roles
 */
export function useAdminRoles(adminId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminsKeys.roles(adminId),
    queryFn: () => adminsService.getAdminRoles(adminId),
    enabled: !!adminId && (options?.enabled ?? true),
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Update an admin's profile
 */
export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, data }: { adminId: string; data: UpdateAdminRequest }) =>
      adminsService.updateAdmin(adminId, data),
    onSuccess: (_data, variables) => {
      toast.success('Admin updated successfully');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: adminsKeys.detail(variables.adminId) });
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}

/**
 * Delete an admin
 */
export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, data }: { adminId: string; data: DeleteAdminRequest }) =>
      adminsService.deleteAdmin(adminId, data),
    onSuccess: (_data, { adminId }) => {
      toast.success('Admin deleted successfully');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: adminsKeys.detail(adminId) });
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}

/**
 * Update admin roles
 */
export function useUpdateAdminRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, data }: { adminId: string; data: UpdateAdminRolesRequest }) =>
      adminsService.updateAdminRoles(adminId, data),
    onSuccess: (_data, variables) => {
      toast.success('Admin roles updated successfully');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: adminsKeys.roles(variables.adminId) });
      queryClient.invalidateQueries({ queryKey: adminsKeys.detail(variables.adminId) });
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}
