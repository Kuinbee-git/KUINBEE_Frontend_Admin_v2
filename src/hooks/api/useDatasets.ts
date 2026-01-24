/**
 * Datasets API Hooks
 * React Query hooks for dataset management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as datasetsService from '@/services/datasets.service';
import type {
  DatasetListParams,
  DatasetProposalParams,
  AssignedDatasetParams,
  UploadListParams,
} from '@/services/datasets.service';
import type {
  CreateDatasetRequest,
  UpdateDatasetRequest,
  UpdateDatasetMetadataRequest,
  PublishDatasetRequest,
  ApproveProposalRequest,
  RejectProposalRequest,
  RequestChangesRequest,
  UploadScope,
} from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

// ============================================
// Query Keys
// ============================================

export const datasetsKeys = {
  all: ['datasets'] as const,
  lists: () => [...datasetsKeys.all, 'list'] as const,
  list: (params: DatasetListParams) => [...datasetsKeys.lists(), params] as const,
  details: () => [...datasetsKeys.all, 'detail'] as const,
  detail: (id: string) => [...datasetsKeys.details(), id] as const,
  uploads: (datasetId: string) => [...datasetsKeys.all, 'uploads', datasetId] as const,
  proposals: () => [...datasetsKeys.all, 'proposals'] as const,
  proposalList: (params: DatasetProposalParams) => [...datasetsKeys.proposals(), params] as const,
  assigned: () => [...datasetsKeys.all, 'assigned'] as const,
  assignedList: (params: AssignedDatasetParams) => [...datasetsKeys.assigned(), params] as const,
};

// ============================================
// Dataset Queries
// ============================================

export function useDatasets(params: DatasetListParams = {}) {
  return useQuery({
    queryKey: datasetsKeys.list(params),
    queryFn: () => datasetsService.getDatasets(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useDataset(datasetId: string) {
  return useQuery({
    queryKey: datasetsKeys.detail(datasetId),
    queryFn: () => datasetsService.getDatasetById(datasetId),
    enabled: !!datasetId,
  });
}

export function useProposalReview(datasetId: string) {
  return useQuery({
    queryKey: [...datasetsKeys.detail(datasetId), 'review'],
    queryFn: () => datasetsService.getProposalForReview(datasetId),
    enabled: !!datasetId,
  });
}

export function useDatasetUploads(datasetId: string, params: UploadListParams = {}) {
  return useQuery({
    queryKey: [...datasetsKeys.uploads(datasetId), params],
    queryFn: () => datasetsService.getDatasetUploads(datasetId, params),
    enabled: !!datasetId,
  });
}

// ============================================
// Proposal Queries
// ============================================

export function useDatasetProposals(params: DatasetProposalParams = {}) {
  return useQuery({
    queryKey: datasetsKeys.proposalList(params),
    queryFn: () => datasetsService.getDatasetProposals(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useAssignedDatasets(params: AssignedDatasetParams = {}) {
  return useQuery({
    queryKey: datasetsKeys.assignedList(params),
    queryFn: () => datasetsService.getAssignedDatasets(params),
  });
}

// ============================================
// Dataset Mutations
// ============================================

export function useCreateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDatasetRequest) => datasetsService.createDataset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
      toast.success('Dataset created successfully');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to create dataset');
    },
  });
}

export function useUpdateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: UpdateDatasetRequest }) =>
      datasetsService.updateDataset(datasetId, data),
    onSuccess: (_, { datasetId }) => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.detail(datasetId) });
      toast.success('Dataset updated successfully');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to update dataset');
    },
  });
}

export function useUpdateDatasetMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: UpdateDatasetMetadataRequest }) =>
      datasetsService.updateDatasetMetadata(datasetId, data),
    onSuccess: (_, { datasetId }) => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.detail(datasetId) });
      toast.success('Metadata updated successfully');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to update metadata');
    },
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datasetId: string) => datasetsService.deleteDataset(datasetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
      toast.success('Dataset deleted successfully');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to delete dataset');
    },
  });
}

export function usePublishDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: PublishDatasetRequest }) =>
      datasetsService.publishDataset(datasetId, data),
    onSuccess: (_, { datasetId }) => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.detail(datasetId) });
      toast.success('Dataset published successfully');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to publish dataset');
    },
  });
}

export function useUnpublishDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datasetId: string) => datasetsService.unpublishDataset(datasetId),
    onSuccess: (_, datasetId) => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.detail(datasetId) });
      toast.success('Dataset unpublished');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to unpublish dataset');
    },
  });
}

// ============================================
// Upload Mutations
// ============================================

export function useUploadDatasetFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, file, scope }: { datasetId: string; file: File; scope?: UploadScope }) =>
      datasetsService.uploadDatasetFile(datasetId, file, { scope }),
    onSuccess: (_, { datasetId }) => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.uploads(datasetId) });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.detail(datasetId) });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to upload file');
    },
  });
}

// ============================================
// Proposal Mutations
// ============================================

export function usePickProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datasetId: string) => datasetsService.pickProposal(datasetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.assigned() });
      toast.success('Proposal assigned to you');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to pick proposal');
    },
  });
}

export function useApproveProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data?: ApproveProposalRequest }) =>
      datasetsService.approveProposal(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.assigned() });
      toast.success('Proposal approved');
    },
    onError: (error) => {
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to approve proposal');
    },
  });
}

export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: RejectProposalRequest }) =>
      datasetsService.rejectProposal(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.assigned() });
      toast.success('Proposal rejected');
    },
    onError: (error) => {
      // Skip toast for auth errors - global handler will redirect
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to reject proposal');
    },
  });
}

export function useRequestChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: RequestChangesRequest }) =>
      datasetsService.requestChanges(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKeys.proposals() });
      queryClient.invalidateQueries({ queryKey: datasetsKeys.assigned() });
      toast.success('Changes requested');
    },
    onError: (error) => {
      // Skip toast for auth errors - global handler will redirect
      const err = error as any;
      if (err?.statusCode === 401 || err?.statusCode === 403) return;
      toast.error(getFriendlyErrorMessage(error) || 'Failed to request changes');
    },
  });
}

// ============================================
// Prefetch
// ============================================

export function usePrefetchDataset() {
  const queryClient = useQueryClient();

  return (datasetId: string) => {
    queryClient.prefetchQuery({
      queryKey: datasetsKeys.detail(datasetId),
      queryFn: () => datasetsService.getDatasetById(datasetId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
