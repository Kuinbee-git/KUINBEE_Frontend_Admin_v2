'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { datasetContentApi } from '@/services/dataset-content.service';
import * as legacy from '@/services/datasets.service';
import { DATASET_CONTENT_ADMIN_ENABLED } from '@/lib/dataset-content-environment';
import { useAuthStore } from '@/store/auth.store';
import {
  ambiguousDatasetReviewFailure,
  clearDatasetReviewCommand,
  dispatchDatasetReviewCommand,
  readDatasetReviewCommand,
  storeDatasetReviewCommand,
} from '@/lib/datasets/dataset-review-commands';
import type { DatasetStatus, VerificationStatus } from '@/types';
import { getFriendlyErrorMessage, isSessionExpiredError } from '@/lib/utils/error.utils';
import { toast } from 'sonner';

export interface DatasetReviewQueueRow {
  id: string;
  datasetUniqueId: string;
  title: string;
  supplierName: string;
  supplierEmail: string;
  category: string;
  status: DatasetStatus;
  verificationStatus: VerificationStatus | null;
  assignedTo: string | null;
  submittedAt: string | null;
  representation: 'LEGACY' | 'CONTENT';
  managementContext: 'INITIAL_PROPOSAL' | 'MANAGED' | null;
}
export const datasetContentKeys = ['dataset-content'] as const;
export function useDatasetReviewQueue(
  queue: 'PROPOSALS' | 'UPDATES',
  params: legacy.DatasetProposalParams
) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [
      ...datasetContentKeys,
      userId,
      'queue',
      queue,
      params,
      DATASET_CONTENT_ADMIN_ENABLED,
    ],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async ({
      signal,
    }): Promise<{
      items: DatasetReviewQueueRow[];
      page: number;
      pageSize: number;
      total: number;
    }> => {
      if (DATASET_CONTENT_ADMIN_ENABLED) {
        const result = await datasetContentApi.inbox(
          {
            page: params.page,
            pageSize: params.pageSize,
            q: params.q,
            status: params.status === 'ALL' ? undefined : params.status,
            verificationStatus:
              params.verificationStatus === 'ALL' ? undefined : params.verificationStatus,
            assignedTo: params.assignedTo,
            reviewQueue: queue,
            // Existing screens do not expose arbitrary sorts; retain their default.
          },
          signal
        );
        return {
          ...result,
          items: result.items.map((row) => ({
            id: row.id,
            datasetUniqueId: row.datasetUniqueId,
            title: row.title,
            supplierName: row.supplier ? 'Supplier' : 'Supplier unavailable',
            supplierEmail: row.supplier?.email ?? '',
            category: row.primaryCategory?.name ?? 'Uncategorised',
            status: row.status,
            verificationStatus: row.verificationStatus,
            assignedTo: row.activeAssignment?.adminId ?? null,
            submittedAt: row.submittedAt,
            representation: row.material.representation,
            managementContext: row.managementContext,
          })),
        };
      }
      const result = await (queue === 'UPDATES'
        ? legacy.getDatasetUpdateRequests(params)
        : legacy.getDatasetProposals(params));
      return {
        ...result.pagination,
        items: result.items.map((row) => ({
          id: row.dataset.id,
          datasetUniqueId: row.dataset.datasetUniqueId,
          title: row.dataset.title,
          supplierName: row.supplier?.name ?? 'Supplier unavailable',
          supplierEmail: row.supplier?.email ?? '',
          category: row.primaryCategory?.name ?? 'Uncategorised',
          status: row.dataset.status,
          verificationStatus: row.verification?.status ?? null,
          assignedTo: row.activeAssignment?.adminId ?? null,
          submittedAt: row.verification?.submittedAt ?? null,
          representation: 'LEGACY',
          managementContext: null,
        })),
      };
    },
  });
}

export function useDatasetContentPick(queue: 'PROPOSALS' | 'UPDATES') {
  const actorId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient(),
    router = useRouter();
  return useMutation({
    retry: false,
    mutationFn: async (
      row: Pick<DatasetReviewQueueRow, 'id' | 'representation' | 'managementContext'>
    ) => {
      if (row.representation === 'LEGACY' || !DATASET_CONTENT_ADMIN_ENABLED) {
        return queue === 'UPDATES' ? legacy.pickUpdateRequest(row.id) : legacy.pickProposal(row.id);
      }
      if (!actorId) throw new Error('Sign in before picking a proposal.');
      const path =
        row.managementContext === 'MANAGED'
          ? '/dashboard/update-requests/'
          : '/dashboard/datasets/';
      const previous = readDatasetReviewCommand(row.id, actorId);
      if (previous) {
        router.push(path + row.id);
        throw new Error('Confirm the existing review request on the review page.');
      }
      const review = await datasetContentApi.review(row.id),
        state = review.state;
      if (useAuthStore.getState().user?.id !== actorId)
        throw new Error('The signed-in administrator changed. Refresh before continuing.');
      if (!state.pricing || !state.reviewedContentId)
        throw new Error('Refresh the exact submission before picking it.');
      const command = {
        kind: 'PICK' as const,
        actorId,
        datasetId: row.id,
        body: {
          requestId: crypto.randomUUID(),
          expectedWorkflowRevision: state.workflowRevision,
          expectedReviewedContentId: state.reviewedContentId,
          expectedPricingReference: { id: state.pricing.id, revision: state.pricing.revision },
        },
      };
      storeDatasetReviewCommand(command);
      try {
        await dispatchDatasetReviewCommand(command, actorId);
        clearDatasetReviewCommand(command);
      } catch (error) {
        if (!ambiguousDatasetReviewFailure(error)) clearDatasetReviewCommand(command);
        else router.push(path + row.id);
        throw error;
      }
    },
    onError: (error) => {
      if (!isSessionExpiredError(error)) toast.error(getFriendlyErrorMessage(error));
    },
    onSettled: () => client.invalidateQueries({ queryKey: datasetContentKeys }),
  });
}

export function useDatasetContentAssignments(params: legacy.AssignedDatasetParams) {
  const actorId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [
      ...datasetContentKeys,
      actorId,
      'assignments',
      params,
      DATASET_CONTENT_ADMIN_ENABLED,
    ],
    enabled: Boolean(actorId),
    retry: false,
    queryFn: async ({ signal }) => {
      if (DATASET_CONTENT_ADMIN_ENABLED) {
        const result = await datasetContentApi.assignments(
          { page: params.page, pageSize: params.pageSize, status: params.status },
          signal
        );
        return {
          ...result,
          items: result.items.map((item) => ({
            assignment: item.assignment,
            dataset: {
              id: item.dataset.id,
              datasetUniqueId: item.dataset.datasetUniqueId,
              title: item.dataset.title,
              status: item.dataset.status,
              createdAt: item.dataset.createdAt,
              updatedAt: item.dataset.updatedAt,
            },
            supplier: item.supplier ? { ...item.supplier, name: 'Supplier' } : null,
            representation: item.dataset.material.representation,
            managementContext: item.dataset.managementContext,
          })),
        };
      }
      const result = await legacy.getAssignedDatasets(params);
      return {
        ...result.pagination,
        items: result.items.map((item) => ({
          ...item,
          representation: 'LEGACY' as const,
          managementContext: null,
        })),
      };
    },
  });
}
