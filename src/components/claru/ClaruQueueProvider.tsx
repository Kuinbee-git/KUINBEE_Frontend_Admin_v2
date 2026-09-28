'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { claruKeys } from '@/hooks/api/useClaru';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import {
  pauseClaruQueue,
  restoreClaruQueue,
  subscribeClaruQueueUpdates,
} from '@/services/claru-queue.service';
import { useClaruQueueStore } from '@/store/claru-queue.store';

// Lives in the dashboard shell so navigation never unmounts an active worker.
export function ClaruQueueProvider() {
  const client = useQueryClient();
  const { user, can } = useAuthorization();
  const canManage = can({ anyOf: [PERMISSIONS.CLARU.MANAGE] });
  const items = useClaruQueueStore((state) => state.items);
  const unfinished = items.some((item) => !['ready', 'submitted'].includes(item.status));

  useEffect(() => {
    if (user?.id) restoreClaruQueue(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (user && !canManage) pauseClaruQueue();
  }, [canManage, user]);

  useEffect(
    () =>
      subscribeClaruQueueUpdates((submission) => {
        client.setQueryData(claruKeys.submission(submission.id), submission);
        void client.invalidateQueries({ queryKey: claruKeys.submissions() });
        void client.invalidateQueries({ queryKey: claruKeys.batches() });
      }),
    [client]
  );

  useEffect(() => {
    if (!unfinished) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [unfinished]);

  return null;
}
