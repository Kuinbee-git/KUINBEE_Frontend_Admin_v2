/**
 * Supplier Invites API Hooks
 * React Query hooks for supplier invitation management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as supplierInvitesService from '@/services/supplier-invites.service';
import type { SupplierInviteListParams } from '@/services/supplier-invites.service';
import type { CreateSupplierInviteRequest } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

// ============================================
// Query Keys
// ============================================

export const supplierInvitesKeys = {
  all: ['supplier-invites'] as const,
  lists: () => [...supplierInvitesKeys.all, 'list'] as const,
  list: (params: SupplierInviteListParams) => [...supplierInvitesKeys.lists(), params] as const,
  details: () => [...supplierInvitesKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierInvitesKeys.details(), id] as const,
};

// ============================================
// Queries
// ============================================

export function useSupplierInvites(params: SupplierInviteListParams = {}) {
  return useQuery({
    queryKey: supplierInvitesKeys.list(params),
    queryFn: () => supplierInvitesService.getSupplierInvites(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useSupplierInvite(inviteId: string) {
  return useQuery({
    queryKey: supplierInvitesKeys.detail(inviteId),
    queryFn: () => supplierInvitesService.getSupplierInviteById(inviteId),
    enabled: !!inviteId,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateSupplierInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierInviteRequest) => 
      supplierInvitesService.createSupplierInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierInvitesKeys.lists() });
      toast.success('Supplier invite sent successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to send supplier invite');
    },
  });
}

export function useResendSupplierInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => 
      supplierInvitesService.resendSupplierInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierInvitesKeys.lists() });
      toast.success('Supplier invite resent successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to resend supplier invite');
    },
  });
}
