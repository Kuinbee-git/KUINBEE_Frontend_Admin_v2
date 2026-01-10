/**
 * Invites API Hooks (Superadmin)
 * React Query hooks for admin invitation management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as invitesService from '@/services/invites.service';
import type { InviteListParams, InviteAuditParams } from '@/services/invites.service';
import type { CreateInviteRequest } from '@/types';

// ============================================
// Query Keys
// ============================================

export const invitesKeys = {
  all: ['invites'] as const,
  lists: () => [...invitesKeys.all, 'list'] as const,
  list: (params: InviteListParams) => [...invitesKeys.lists(), params] as const,
  details: () => [...invitesKeys.all, 'detail'] as const,
  detail: (id: string) => [...invitesKeys.details(), id] as const,
  audit: () => [...invitesKeys.all, 'audit'] as const,
  auditList: (params: InviteAuditParams) => [...invitesKeys.audit(), params] as const,
};

// ============================================
// Queries
// ============================================

export function useInvites(params: InviteListParams = {}) {
  return useQuery({
    queryKey: invitesKeys.list(params),
    queryFn: () => invitesService.getInvites(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useInvite(inviteId: string) {
  return useQuery({
    queryKey: invitesKeys.detail(inviteId),
    queryFn: () => invitesService.getInviteById(inviteId),
    enabled: !!inviteId,
  });
}

export function useInviteAudit(params: InviteAuditParams = {}) {
  return useQuery({
    queryKey: invitesKeys.auditList(params),
    queryFn: () => invitesService.getInviteAudit(params),
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteRequest) => invitesService.createInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitesKeys.lists() });
      toast.success('Invite sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invite');
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => invitesService.resendInvite(inviteId),
    onSuccess: (_, inviteId) => {
      queryClient.invalidateQueries({ queryKey: invitesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitesKeys.detail(inviteId) });
      toast.success('Invite resent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resend invite');
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => invitesService.cancelInvite(inviteId),
    onSuccess: (_, inviteId) => {
      queryClient.invalidateQueries({ queryKey: invitesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitesKeys.detail(inviteId) });
      toast.success('Invite cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invite');
    },
  });
}
