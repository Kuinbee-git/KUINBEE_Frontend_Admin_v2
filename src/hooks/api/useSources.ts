/**
 * Sources API Hooks
 * React Query hooks for source management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as sourcesService from '@/services/sources.service';
import type { SourceListParams } from '@/services/sources.service';
import type { CreateSourceRequest, UpdateSourceRequest } from '@/types';

// ============================================
// Query Keys
// ============================================

export const sourcesKeys = {
  all: ['sources'] as const,
  lists: () => [...sourcesKeys.all, 'list'] as const,
  list: (params: SourceListParams) => [...sourcesKeys.lists(), params] as const,
};

// ============================================
// Queries
// ============================================

export function useSources(params: SourceListParams = {}) {
  return useQuery({
    queryKey: sourcesKeys.list(params),
    queryFn: () => sourcesService.getSources(params),
    placeholderData: (previousData) => previousData,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSourceRequest) => sourcesService.createSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });
      toast.success('Source created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create source');
    },
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, data }: { sourceId: string; data: UpdateSourceRequest }) =>
      sourcesService.updateSource(sourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });
      toast.success('Source updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update source');
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) => sourcesService.deleteSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sourcesKeys.lists() });
      toast.success('Source deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete source');
    },
  });
}
