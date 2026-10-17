'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { datasetContentApi } from '@/services/dataset-content.service';
import { DATASET_CONTENT_ADMIN_ENABLED } from '@/lib/dataset-content-environment';
import { readDatasetReviewCommand } from '@/lib/datasets/dataset-review-commands';
import { ContentDatasetReview } from './ContentDatasetReview';

export function ContentReviewBoundary({
  datasetId,
  legacy,
  queueType,
}: {
  datasetId: string;
  legacy: ReactNode;
  queueType: 'proposals' | 'update-requests';
}) {
  const actorId = useAuthStore((state) => state.user?.id);
  const query = useQuery({
    queryKey: ['dataset-content-boundary', actorId, datasetId],
    enabled: DATASET_CONTENT_ADMIN_ENABLED && Boolean(actorId),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      try {
        await datasetContentApi.review(datasetId, signal);
        return 'CONTENT' as const;
      } catch (error) {
        // v1 review is itself restricted to LEGACY server-side. Never downgrade
        // authentication, authorization, validation or transient failures.
        if (
          error &&
          typeof error === 'object' &&
          'statusCode' in error &&
          error.statusCode === 404 &&
          'code' in error &&
          error.code === 'NOT_FOUND' &&
          !readDatasetReviewCommand(datasetId, actorId!)
        )
          return 'LEGACY' as const;
        throw error;
      }
    },
  });
  if (!DATASET_CONTENT_ADMIN_ENABLED || query.data === 'LEGACY') return legacy;
  if (!actorId) return <p role="status">Sign in to review this Dataset.</p>;
  if (query.isPending) return <p role="status">Loading Dataset review…</p>;
  // A failed discovery read still allows an owned uncertain command to be
  // explicitly recovered. The content view keeps other actions locked.
  return (
    <ContentDatasetReview
      key={datasetId + actorId}
      datasetId={datasetId}
      actorId={actorId}
      queueType={queueType}
    />
  );
}
