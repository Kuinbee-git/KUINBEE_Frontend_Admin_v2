'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useComponentRequest } from '@/hooks/useComponentRequest';
import { useAuthStore } from '@/store/auth.store';
import {
  datasetContentApi,
  type AdminDatasetReview,
  type AdminDatasetAssessment,
} from '@/services/dataset-content.service';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { datasetsKeys } from './useDatasets';
import { datasetContentKeys } from './useDatasetContentQueue';
import {
  ambiguousDatasetReviewFailure,
  clearDatasetReviewCommand,
  dispatchDatasetReviewCommand,
  readDatasetReviewCommand,
  storeDatasetReviewCommand,
  type DatasetReviewCommand,
} from '@/lib/datasets/dataset-review-commands';

export type DatasetReviewSnapshot = {
  review: AdminDatasetReview;
  assessment: AdminDatasetAssessment;
};

// A receipt proves its command, never current authority. Every acknowledged
// decision is followed by a new read before another operation is enabled.
export function useDatasetContentReview(datasetId: string, actorId: string) {
  const client = useQueryClient();
  const [snapshot, setSnapshot] = useState<DatasetReviewSnapshot | null>(null);
  const [pending, setPending] = useState<DatasetReviewCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const flight = useRef(false);
  const currentActor = useCallback(() => {
    if (useAuthStore.getState().user?.id !== actorId)
      throw new Error('The signed-in administrator changed. Refresh before continuing.');
  }, [actorId]);

  const readCurrent = useCallback(async () => {
    currentActor();
    const [review, assessment] = await Promise.all([
      datasetContentApi.review(datasetId),
      datasetContentApi.assessment(datasetId, 'REVIEWED'),
    ]);
    currentActor();
    if (
      review.state.workflowRevision !== assessment.state.workflowRevision ||
      review.submittedContent.id !== assessment.state.reviewedContentId
    ) {
      throw new Error('The review changed while loading. Refresh to read one current review.');
    }
    return { review, assessment };
  }, [currentActor, datasetId]);

  const refresh = useCallback(async () => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setReady(false);
    setError(null);
    try {
      currentActor();
      const retained = readDatasetReviewCommand(datasetId, actorId);
      setPending(retained);
      const fresh = await readCurrent();
      setSnapshot(fresh);
      setReady(true);
    } catch (problem) {
      setError(getFriendlyErrorMessage(problem));
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }, [actorId, currentActor, datasetId, readCurrent]);
  useComponentRequest(refresh, [datasetId, actorId]);

  const execute = useCallback(
    async (command: DatasetReviewCommand, replay = false) => {
      if (flight.current) throw new Error('Wait for the current review request.');
      currentActor();
      if (command.datasetId !== datasetId || command.actorId !== actorId)
        throw new Error('This request belongs to another review.');
      if (!replay && (!ready || pending || !snapshot))
        throw new Error('Confirm the pending request and refresh before continuing.');
      flight.current = true;
      setBusy(true);
      setReady(false);
      setError(null);
      let acknowledged = false;
      try {
        storeDatasetReviewCommand(command);
        setPending(command);
        await dispatchDatasetReviewCommand(command, useAuthStore.getState().user?.id ?? '');
        acknowledged = true;
        clearDatasetReviewCommand(command);
        setPending(null);
        const fresh = await readCurrent();
        setSnapshot(fresh);
        setReady(true);
      } catch (problem) {
        if (!acknowledged && !ambiguousDatasetReviewFailure(problem)) {
          clearDatasetReviewCommand(command);
          setPending(null);
        }
        setError(
          (acknowledged
            ? 'The decision was acknowledged, but current review could not be refreshed. '
            : '') + getFriendlyErrorMessage(problem)
        );
        throw problem;
      } finally {
        flight.current = false;
        setBusy(false);
        void client.invalidateQueries({ queryKey: datasetContentKeys });
        void client.invalidateQueries({ queryKey: datasetsKeys.all });
      }
    },
    [actorId, client, currentActor, datasetId, pending, readCurrent, ready, snapshot]
  );
  return {
    snapshot,
    pending,
    error,
    busy,
    ready,
    refresh,
    execute,
    locked: busy || !ready || pending !== null,
  };
}
