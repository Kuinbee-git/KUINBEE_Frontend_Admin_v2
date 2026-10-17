'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  DatasetFrozenInventoryQuery,
  DatasetFileObservationQuery,
} from '@kuinbee/dataset-preparation-contracts';
import {
  datasetContentApi,
  type AdminDatasetReview,
  type AdminDatasetFrozenInventory,
  type AdminDatasetObservations,
} from '@/services/dataset-content.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { ReviewFacts, ReviewFactTree, reviewLabel } from './ContentReviewFacts';
import { TableMetadataPanel } from './ContentTableMetadataPanel';
import { ReferenceViews } from './ContentReferenceViews';

export type FrozenAdminInventoryView = {
  state: Pick<AdminDatasetReview['state'], 'datasetId' | 'workflowRevision'>;
  submittedContent: AdminDatasetReview['submittedContent'];
};
type FileMember = Extract<AdminDatasetFrozenInventory, { inventory: 'FILES' }>['items'][number];

export function ContentReviewInventory({
  review,
  actorId,
  locked,
  target = 'REVIEWED',
  publicationId,
}: {
  review: FrozenAdminInventoryView;
  actorId: string;
  locked: boolean;
  target?: 'REVIEWED' | 'PUBLISHED';
  publicationId?: string;
}) {
  const { state, submittedContent: frozen } = review;
  const [kind, setKind] = useState<DatasetFrozenInventoryQuery['inventory']>('FILES');
  const [component, setComponent] = useState<'ALL' | 'FULL' | 'SAMPLE'>('ALL');
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const input: DatasetFrozenInventoryQuery = {
    expectedWorkflowRevision: state.workflowRevision,
    contentId: frozen.id,
    contentGeneration: frozen.generation,
    inventory: kind,
    ...(component === 'ALL' ? {} : { component }),
    afterId: cursors.at(-1),
    limit: 20,
  };
  const page = useQuery({
    queryKey: ['dataset-admin-frozen-inventory', target, actorId, state.datasetId, input],
    enabled: !locked,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      const result = await datasetContentApi.frozenInventory(
        state.datasetId,
        input,
        signal,
        target
      );
      if (result.frozenAt !== frozen.frozenAt)
        throw new Error('The frozen submission changed. Refresh before continuing.');
      return result;
    },
  });
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Frozen selected files, groups and relationships. Captured inspection references and current
        security records are separate. Downloads recheck current backend authorization and security.
      </p>
      <div className="flex flex-wrap gap-3">
        <label htmlFor={target + '-inventory-kind'} className="text-sm">
          Inventory{' '}
          <select
            id={target + '-inventory-kind'}
            aria-label={target === 'PUBLISHED' ? 'Published inventory' : 'Review inventory'}
            value={kind}
            disabled={locked}
            onChange={(event) => {
              setKind(event.target.value as typeof kind);
              setCursors([undefined]);
            }}
            className="p-2 rounded border"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
          >
            <option value="FILES">Files</option>
            <option value="GROUPS">Groups</option>
            <option value="RELATIONSHIPS">Relationships</option>
          </select>
        </label>
        <label htmlFor={target + '-inventory-material'} className="text-sm">
          Material{' '}
          <select
            id={target + '-inventory-material'}
            aria-label={target === 'PUBLISHED' ? 'Published material' : 'Review material'}
            value={component}
            disabled={locked}
            onChange={(event) => {
              setComponent(event.target.value as typeof component);
              setCursors([undefined]);
            }}
            className="p-2 rounded border"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
          >
            <option value="ALL">All material</option>
            <option value="FULL">Full dataset</option>
            <option value="SAMPLE">Sample</option>
          </select>
        </label>
      </div>
      {locked ? (
        <p>Refresh or confirm the pending review request to load files.</p>
      ) : page.isPending ? (
        <p role="status">Loading frozen inventory…</p>
      ) : page.isError ? (
        <p role="alert">{getFriendlyErrorMessage(page.error)}</p>
      ) : (
        <>
          <p className="text-sm">
            {page.data.total} {reviewLabel(kind).toLowerCase()} in this selection
          </p>
          <ul className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {page.data.inventory === 'FILES'
              ? page.data.items.map((member) => (
                  <li className="py-4 min-w-0" key={member.id}>
                    <ReviewFile
                      key={member.id}
                      review={review}
                      actorId={actorId}
                      member={member}
                      locked={locked}
                      target={target}
                      publicationId={publicationId}
                    />
                  </li>
                ))
              : page.data.items.map((item) => (
                  <li className="py-4 min-w-0" key={item.id}>
                    <ReviewFactTree value={item} />
                  </li>
                ))}
          </ul>
          {!page.data.items.length && <p>No items in this selection.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={cursors.length === 1}
              onClick={() => setCursors((value) => value.slice(0, -1))}
            >
              Previous inventory page
            </Button>
            <span className="text-sm">Page {cursors.length}</span>
            <Button
              variant="outline"
              disabled={!page.data.nextCursor}
              onClick={() => {
                const next = page.data.nextCursor;
                if (next) setCursors((value) => [...value, next.afterId]);
              }}
            >
              Next inventory page
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ReviewFile({
  review,
  actorId,
  member,
  locked,
  target,
  publicationId,
}: {
  review: FrozenAdminInventoryView;
  actorId: string;
  member: FileMember;
  locked: boolean;
  target: 'REVIEWED' | 'PUBLISHED';
  publicationId?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [observed, setObserved] = useState<{
    query: DatasetFileObservationQuery;
    page: AdminDatasetObservations;
  } | null>(null);
  const inFlight = useRef(false);
  const live = useRef({ locked, actorId });
  // Event completions must not open a URL for a former actor or a locked view.
  useLayoutEffect(() => {
    live.current = { locked, actorId };
    return () => {
      live.current = { locked: true, actorId };
    };
  }, [locked, actorId]);
  const currentActorId = useAuthStore((state) => state.user?.id);
  const context = {
    scope: target,
    component: member.component,
    contentId: review.submittedContent.id,
    contentGeneration: review.submittedContent.generation,
    expectedWorkflowRevision: review.state.workflowRevision,
  };
  const assertCurrent = () => {
    if (
      live.current.locked ||
      useAuthStore.getState().user?.id !== actorId ||
      live.current.actorId !== actorId
    )
      throw new Error('Refresh this review before requesting files.');
  };
  async function run(task: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      assertCurrent();
      await task();
    } catch (problem) {
      setError(getFriendlyErrorMessage(problem));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const inspect = (query: DatasetFileObservationQuery) =>
    run(async () => {
      const page = await datasetContentApi.observations(review.state.datasetId, query);
      assertCurrent();
      if (target === 'PUBLISHED' && page.context.publicationId !== publicationId)
        throw new Error('The exact publication changed. Refresh before continuing.');
      setObserved({ page, query });
    });
  const download = () =>
    run(async () => {
      const result = await datasetContentApi.download(review.state.datasetId, {
        ...context,
        memberId: member.id,
        downloadIntentId: crypto.randomUUID(),
      });
      assertCurrent();
      if (Date.parse(result.expiresAt) <= Date.now())
        throw new Error('The download link expired. Request a fresh download.');
      if (target === 'PUBLISHED' && result.context.publicationId !== publicationId)
        throw new Error('The exact publication changed. Refresh before continuing.');
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium break-words">
            {member.originalFileName ?? 'File name not recorded'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {member.component === 'FULL' ? 'Full dataset' : 'Sample'} · {reviewLabel(member.role)} ·{' '}
            {member.measuredSizeBytes} bytes · {reviewLabel(member.inspection.securityState)}
          </p>
        </div>
        <Button variant="outline" disabled={locked || busy} onClick={download}>
          Download {target === 'PUBLISHED' ? 'published' : 'reviewed'} file
        </Button>
      </div>
      <TableMetadataPanel
        sourceKey={JSON.stringify([actorId, review.state.datasetId, context, member.id])}
        enabled={!locked && currentActorId === actorId}
        load={async (filters, signal) => {
          const result = await datasetContentApi.tableMetadata(
            review.state.datasetId,
            { ...filters, ...context, memberId: member.id, limit: filters.limit },
            signal
          );
          if (target === 'PUBLISHED' && result.context.publicationId !== publicationId)
            throw new Error(
              'The exact published table context changed. Refresh before continuing.'
            );
          return result;
        }}
      />
      <ReferenceViews
        sourceKey={JSON.stringify([actorId, review.state.datasetId, context, member.id])}
        enabled={!locked && currentActorId === actorId}
        load={async (filters, signal) => {
          const result = await datasetContentApi.tableReferences(
            review.state.datasetId,
            { ...filters, ...context, memberId: member.id, limit: filters.limit },
            signal
          );
          if (target === 'PUBLISHED' && result.context.publicationId !== publicationId)
            throw new Error(
              'The exact published reference context changed. Refresh before continuing.'
            );
          return result;
        }}
      />
      {error && <p role="alert">{error}</p>}
      <details>
        <summary className="cursor-pointer text-sm font-medium">File references and checks</summary>
        <div className="mt-4 space-y-3">
          <ReviewFacts
            rows={[
              ['Material', member.component === 'FULL' ? 'Full dataset' : 'Sample'],
              ['Role', reviewLabel(member.role)],
              ['Size', `${member.measuredSizeBytes} bytes`],
              ['Path', member.relativePath],
              ['Group reference', member.groupId],
              ['Current security record', reviewLabel(member.inspection.securityState)],
              ['Recorded check outcome', reviewLabel(member.inspection.recordedOutcome)],
              ['Evidence pointer current', member.inspection.current ? 'Yes' : 'No'],
              ['Captured evidence reference', member.inspectionAtSubmissionId],
              ['Current evidence reference', member.inspection.currentEvidenceId],
            ]}
          />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Recorded checks do not establish current download or approval eligibility. A ZIP is one
            physical file; entries are inspected references within it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={locked || busy}
              onClick={() =>
                inspect({
                  ...context,
                  memberId: member.id,
                  evidenceId: member.inspectionAtSubmissionId,
                  limit: 10,
                })
              }
            >
              Captured format observations
            </Button>
            {member.inspection.currentEvidenceId &&
              member.inspection.currentEvidenceId !== member.inspectionAtSubmissionId && (
                <Button
                  variant="outline"
                  disabled={locked || busy}
                  onClick={() =>
                    inspect({
                      ...context,
                      memberId: member.id,
                      evidenceId: member.inspection.currentEvidenceId!,
                      limit: 10,
                    })
                  }
                >
                  Current format observations
                </Button>
              )}
          </div>
          {observed && !locked && (
            <div className="space-y-3 text-sm">
              <p>
                Observed facts for {reviewLabel(observed.page.evidenceRelationship).toLowerCase()}{' '}
                evidence ({observed.page.total} records). Domain, intended use and unseen material
                remain supplier declarations.
              </p>
              <ul className="space-y-3">
                {observed.page.items.map((item) => (
                  <li key={item.id}>
                    <ReviewFactTree value={item} />
                  </li>
                ))}
              </ul>
              {!observed.page.items.length && (
                <p>No recorded format observations for this evidence.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={busy || !observed.query.afterId}
                  onClick={() => inspect({ ...observed.query, afterId: undefined })}
                >
                  First observation page
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || !observed.page.nextCursor}
                  onClick={() => {
                    if (observed.page.nextCursor) void inspect(observed.page.nextCursor);
                  }}
                >
                  Next observation page
                </Button>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
