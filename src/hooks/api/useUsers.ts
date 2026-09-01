/**
 * Users API Hooks
 * React Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as usersService from '@/services/users.service';
import type { UserListParams } from '@/services/users.service';
import type { DeleteUserRequest, SuspendUserRequest, UnsuspendUserRequest } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

// ============================================
// Query Keys
// ============================================

const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Get paginated list of users
 */
export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersService.getUsers(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}

/**
 * Get user detail by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersService.getUserById(userId),
    enabled: !!userId,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Suspend user mutation
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: SuspendUserRequest }) =>
      usersService.suspendUser(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      toast.success('User suspended successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to suspend user');
    },
  });
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UnsuspendUserRequest }) =>
      usersService.unsuspendUser(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      toast.success('User activated successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to activate user');
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: DeleteUserRequest }) =>
      usersService.deleteUser(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to delete user');
    },
  });
}
