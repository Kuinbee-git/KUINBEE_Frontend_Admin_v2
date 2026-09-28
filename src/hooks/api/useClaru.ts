import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ClaruBatchListParams, ClaruSubmissionListParams } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import * as service from '@/services/claru.service';

export const claruKeys = {
  all: ['claru'] as const,
  projects: () => [...claruKeys.all, 'projects'] as const,
  batches: () => [...claruKeys.all, 'batches'] as const,
  batchList: (params: ClaruBatchListParams) => [...claruKeys.batches(), 'list', params] as const,
  batch: (batchId: string) => [...claruKeys.batches(), 'detail', batchId] as const,
  submissions: () => [...claruKeys.all, 'submissions'] as const,
  submissionList: (params: ClaruSubmissionListParams) =>
    [...claruKeys.submissions(), 'list', params] as const,
  submission: (submissionId: string) =>
    [...claruKeys.submissions(), 'detail', submissionId] as const,
};

const errorMessage = (error: unknown, fallback: string) =>
  getFriendlyErrorMessage(error) || fallback;

export function useClaruProjects() {
  return useQuery({
    queryKey: claruKeys.projects(),
    queryFn: service.getClaruProjects,
    staleTime: 60_000,
  });
}

export function useClaruBatches(params: ClaruBatchListParams) {
  return useQuery({
    queryKey: claruKeys.batchList(params),
    queryFn: () => service.listClaruBatches(params),
    placeholderData: (previous) => previous,
  });
}

export function useClaruBatch(batchId: string) {
  return useQuery({
    queryKey: claruKeys.batch(batchId),
    queryFn: () => service.getClaruBatch(batchId),
    enabled: Boolean(batchId),
  });
}

export function useCreateClaruBatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: service.createClaruBatch,
    onSuccess: (batch) => {
      client.setQueryData(claruKeys.batch(batch.id), batch);
      client.invalidateQueries({ queryKey: claruKeys.batches() });
      toast.success('Delivery batch created');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create the delivery batch')),
  });
}

export function useClaruSubmissions(params: ClaruSubmissionListParams) {
  return useQuery({
    queryKey: claruKeys.submissionList(params),
    queryFn: () => service.listClaruSubmissions(params),
    placeholderData: (previous) => previous,
    refetchInterval: 60_000,
  });
}

export function useClaruSubmission(submissionId: string) {
  return useQuery({
    queryKey: claruKeys.submission(submissionId),
    queryFn: () => service.getClaruSubmission(submissionId),
    enabled: Boolean(submissionId),
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === 'processing' || state === 'in_review' ? 60_000 : false;
    },
  });
}

export function useCreateClaruSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof service.createClaruSubmission>[0]) =>
      service.createClaruSubmission(input),
    onSuccess: (result) => {
      client.setQueryData(claruKeys.submission(result.submission.id), result.submission);
      client.invalidateQueries({ queryKey: claruKeys.submissions() });
      client.invalidateQueries({ queryKey: claruKeys.batches() });
    },
    onError: (error) => {
      client.invalidateQueries({ queryKey: claruKeys.projects() });
      client.invalidateQueries({ queryKey: claruKeys.submissions() });
      toast.error(errorMessage(error, 'Could not create the Claru submission'));
    },
  });
}

export function useCheckpointClaruPart() {
  return useMutation({ mutationFn: service.checkpointClaruPart });
}

export function useCompleteClaruPart() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: service.completeClaruPart,
    onSuccess: (submission) => {
      client.setQueryData(claruKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: claruKeys.submissions() });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not complete the uploaded file')),
  });
}

export function useSealClaruSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: service.sealClaruSubmission,
    onSuccess: (submission) => {
      client.setQueryData(claruKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: claruKeys.submissions() });
      toast.success('Submission sealed and sent to Claru');
    },
    onError: (error) => toast.error(errorMessage(error, 'Claru could not seal the submission')),
    onSettled: (_data, _error, submissionId) => {
      client.invalidateQueries({ queryKey: claruKeys.submission(submissionId) });
      client.invalidateQueries({ queryKey: claruKeys.submissions() });
    },
  });
}

export function useSyncClaruSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: service.syncClaruSubmission,
    onSuccess: (submission) => {
      client.setQueryData(claruKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: claruKeys.submissions() });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not refresh the Claru status')),
  });
}
