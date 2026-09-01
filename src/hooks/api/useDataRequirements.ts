import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DataRequirementListParams } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import * as service from '@/services/data-requirement.service';

const dataRequirementKeys = {
  all: ['data-requirements'] as const,
  lists: () => [...dataRequirementKeys.all, 'list'] as const,
  list: (params: DataRequirementListParams) => [...dataRequirementKeys.lists(), params] as const,
  details: () => [...dataRequirementKeys.all, 'detail'] as const,
  detail: (id: string) => [...dataRequirementKeys.details(), id] as const,
};

const message = (error: unknown, fallback: string) => getFriendlyErrorMessage(error) || fallback;

export function useDataRequirements(params: DataRequirementListParams) {
  return useQuery({
    queryKey: dataRequirementKeys.list(params),
    queryFn: () => service.listDataRequirements(params),
    placeholderData: (previous) => previous,
  });
}

export function useDataRequirement(requirementId: string) {
  return useQuery({
    queryKey: dataRequirementKeys.detail(requirementId),
    queryFn: () => service.getDataRequirement(requirementId),
    enabled: Boolean(requirementId),
  });
}

export function usePatchDataRequirement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: service.patchDataRequirement,
    onSuccess: (data) => {
      client.setQueryData(dataRequirementKeys.detail(data.id), data);
      client.invalidateQueries({ queryKey: dataRequirementKeys.lists() });
      toast.success('Requirement saved');
    },
    onError: (error) => toast.error(message(error, 'Failed to save requirement')),
  });
}

export function useDataRequirementAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: service.actionDataRequirement,
    onSuccess: (data, args) => {
      client.setQueryData(dataRequirementKeys.detail(data.id), data);
      client.invalidateQueries({ queryKey: dataRequirementKeys.lists() });
      toast.success(`Requirement ${args.action.replace('-', ' ')} complete`);
    },
    onError: (error) => toast.error(message(error, 'Failed to update requirement')),
  });
}
