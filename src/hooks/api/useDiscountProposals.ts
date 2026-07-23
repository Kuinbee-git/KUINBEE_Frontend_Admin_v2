import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as discountProposalsService from '@/services/discount-proposals.service';
import type {
  DiscountProposalApproveBody,
  DiscountProposalListParams,
  DiscountProposalRejectBody,
} from '@/types/discount.types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

export const discountProposalKeys = {
  all: ['discount-proposals'] as const,
  lists: () => [...discountProposalKeys.all, 'list'] as const,
  list: (params: DiscountProposalListParams) => [...discountProposalKeys.lists(), params] as const,
  details: () => [...discountProposalKeys.all, 'detail'] as const,
  detail: (discountProposalId: string) =>
    [...discountProposalKeys.details(), discountProposalId] as const,
};

export function useDiscountProposals(params: DiscountProposalListParams = {}) {
  return useQuery({
    queryKey: discountProposalKeys.list(params),
    queryFn: () => discountProposalsService.getDiscountProposals(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useDiscountProposalReview(discountProposalId: string) {
  return useQuery({
    queryKey: discountProposalKeys.detail(discountProposalId),
    queryFn: () => discountProposalsService.getDiscountProposalReview(discountProposalId),
    enabled: Boolean(discountProposalId),
  });
}

export function useApproveDiscountProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discountProposalId,
      data,
    }: {
      discountProposalId: string;
      data?: DiscountProposalApproveBody;
    }) => discountProposalsService.approveDiscountProposal(discountProposalId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: discountProposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: discountProposalKeys.detail(variables.discountProposalId),
      });
      toast.success('Discount proposal approved');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to approve discount proposal');
    },
  });
}

export function useRejectDiscountProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discountProposalId,
      data,
    }: {
      discountProposalId: string;
      data: DiscountProposalRejectBody;
    }) => discountProposalsService.rejectDiscountProposal(discountProposalId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: discountProposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: discountProposalKeys.detail(variables.discountProposalId),
      });
      toast.success('Discount proposal rejected');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error) || 'Failed to reject discount proposal');
    },
  });
}
