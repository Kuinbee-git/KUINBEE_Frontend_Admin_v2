import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as service from '@/services/custom-collection.service';
import type {
  CustomCollectionLeadListParams,
  CustomCollectionLeadStatus,
  CustomCollectionListParams,
} from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

const customCollectionKeys = {
  all: ['custom-collection'] as const,
  serviceLists: () => [...customCollectionKeys.all, 'services'] as const,
  serviceList: (params: CustomCollectionListParams) =>
    [...customCollectionKeys.serviceLists(), params] as const,
  serviceDetails: () => [...customCollectionKeys.all, 'service-detail'] as const,
  serviceDetail: (id: string) => [...customCollectionKeys.serviceDetails(), id] as const,
  leadLists: () => [...customCollectionKeys.all, 'leads'] as const,
  leadList: (params: CustomCollectionLeadListParams) =>
    [...customCollectionKeys.leadLists(), params] as const,
  leadDetails: () => [...customCollectionKeys.all, 'lead-detail'] as const,
  leadDetail: (id: string) => [...customCollectionKeys.leadDetails(), id] as const,
};

const errorMessage = (error: unknown, fallback: string) =>
  getFriendlyErrorMessage(error) || fallback;

export function useCustomCollectionServices(params: CustomCollectionListParams) {
  return useQuery({
    queryKey: customCollectionKeys.serviceList(params),
    queryFn: () => service.listCustomCollectionServices(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomCollectionService(serviceId: string) {
  return useQuery({
    queryKey: customCollectionKeys.serviceDetail(serviceId),
    queryFn: () => service.getCustomCollectionService(serviceId),
    enabled: !!serviceId,
  });
}

export function usePickCustomCollectionRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.pickCustomCollectionRevision,
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.serviceLists() });
      queryClient.invalidateQueries({
        queryKey: customCollectionKeys.serviceDetail(args.serviceId),
      });
      toast.success('Review assigned to you');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to pick review')),
  });
}

export function useApproveCustomCollectionRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.approveCustomCollectionRevision,
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.serviceLists() });
      queryClient.invalidateQueries({
        queryKey: customCollectionKeys.serviceDetail(args.serviceId),
      });
      toast.success('Custom service approved');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to approve custom service')),
  });
}

export function useRequestCustomCollectionChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.requestCustomCollectionChanges,
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.serviceLists() });
      queryClient.invalidateQueries({
        queryKey: customCollectionKeys.serviceDetail(args.serviceId),
      });
      toast.success('Changes requested');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to request changes')),
  });
}

export function useRejectCustomCollectionRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.rejectCustomCollectionRevision,
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.serviceLists() });
      queryClient.invalidateQueries({
        queryKey: customCollectionKeys.serviceDetail(args.serviceId),
      });
      toast.success('Custom service rejected');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to reject custom service')),
  });
}

export function useArchiveCustomCollectionService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.archiveCustomCollectionService,
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.serviceLists() });
      queryClient.invalidateQueries({
        queryKey: customCollectionKeys.serviceDetail(args.serviceId),
      });
      toast.success('Custom service archived');
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to archive custom service')),
  });
}

export function useCustomCollectionLeads(params: CustomCollectionLeadListParams) {
  return useQuery({
    queryKey: customCollectionKeys.leadList(params),
    queryFn: () => service.listCustomCollectionLeads(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomCollectionLead(leadId: string) {
  return useQuery({
    queryKey: customCollectionKeys.leadDetail(leadId),
    queryFn: () => service.getCustomCollectionLead(leadId),
    enabled: !!leadId,
  });
}

export function useUpdateCustomCollectionLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateCustomCollectionLeadStatus,
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.leadLists() });
      queryClient.invalidateQueries({ queryKey: customCollectionKeys.leadDetail(args.leadId) });
      toast.success(`Lead marked ${args.status.toLowerCase()}`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to update lead')),
  });
}

export function isTerminalLeadStatus(status: CustomCollectionLeadStatus) {
  return status === 'WON' || status === 'LOST' || status === 'SPAM';
}
