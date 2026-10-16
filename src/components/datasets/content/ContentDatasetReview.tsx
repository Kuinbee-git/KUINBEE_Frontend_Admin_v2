'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DATASET_UPLOAD_CHOICES,
  DATASET_MODALITIES,
  formatDatasetGeographicCoverage,
  formatDatasetCollectionPeriod,
} from '@kuinbee/dataset-preparation-contracts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDatasetContentReview } from '@/hooks/api/useDatasetContentReview';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PERMISSIONS } from '@/lib/constants/permissions';
import {
  DatasetReviewCommandSchema,
  type DatasetReviewCommand,
} from '@/lib/datasets/dataset-review-commands';
import type { AdminDatasetReview } from '@/services/dataset-content.service';
import { ContentAssessment } from './ContentAssessment';
import { ContentPublishedReview } from './ContentPublishedReview';
import { ContentReviewInventory } from './ContentReviewInventory';
import {
  ReviewFacts,
  ReviewContentMetadata,
  ReviewSection,
  reviewLabel,
} from './ContentReviewFacts';

type Decision = 'APPROVE' | 'REJECT' | 'CHANGES';
type Execute = (command: DatasetReviewCommand, replay?: boolean) => Promise<void>;
const priceLabel = (price: { isPaid: boolean; price: string | null; currency: string }) =>
  price.isPaid ? `${price.price} ${price.currency}` : 'Free';
const box = {
  background: 'var(--bg-base)',
  borderColor: 'var(--border-default)',
  color: 'var(--text-primary)',
};

export function ContentDatasetReview({
  datasetId,
  actorId,
  queueType,
}: {
  datasetId: string;
  actorId: string;
  queueType: 'proposals' | 'update-requests';
}) {
  const router = useRouter(),
    { can } = useAuthorization();
  const controller = useDatasetContentReview(datasetId, actorId);
  const { snapshot, pending, error, busy, ready, locked, execute, refresh } = controller;
  const review = snapshot?.review,
    state = review?.state,
    frozen = review?.submittedContent;
  const ownAssignment =
    review?.assignment?.status === 'ACTIVE' && review.assignment.adminId === actorId;
  const underReview =
    state?.datasetStatus === 'UNDER_REVIEW' && state.verificationStatus === 'UNDER_REVIEW';
  const actions = {
    APPROVE: can({ anyOf: [PERMISSIONS.DATASETS.APPROVE] }),
    REJECT: can({ anyOf: [PERMISSIONS.DATASETS.REJECT] }),
    CHANGES: can({ anyOf: [PERMISSIONS.DATASETS.REQUEST_CHANGES] }),
  };
  const canPick = can({
    anyOf: [
      PERMISSIONS.DATASETS.VIEW_PROPOSALS,
      PERMISSIONS.DATASETS.APPROVE,
      PERMISSIONS.DATASETS.REJECT,
      PERMISSIONS.DATASETS.REQUEST_CHANGES,
    ],
  });
  const pick = async () => {
    if (!state?.pricing || !state.reviewedContentId) return;
    await execute({
      kind: 'PICK',
      actorId,
      datasetId,
      body: {
        requestId: crypto.randomUUID(),
        expectedWorkflowRevision: state.workflowRevision,
        expectedReviewedContentId: state.reviewedContentId,
        expectedPricingReference: { id: state.pricing.id, revision: state.pricing.revision },
      },
    });
  };
  const signature = state
    ? `${state.workflowRevision}:${state.reviewedContentId}:${state.pricing?.id}:${state.pricing?.revision}`
    : '';
  return (
    <div
      className="space-y-5"
      data-content-review={datasetId}
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                queueType === 'update-requests'
                  ? '/dashboard/update-requests'
                  : '/dashboard/proposals'
              )
            }
          >
            Back to review queue
          </Button>
          <h1 className="text-2xl font-semibold mt-3 break-words">
            {frozen?.common.title ?? 'Dataset review'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {state?.datasetUniqueId} · Frozen supplier submission
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void refresh()}>
          Refresh current review
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {pending && (
        <section
          className="border rounded-xl p-4 space-y-3"
          style={box}
          aria-label="Unconfirmed review request"
        >
          <h2 className="font-semibold">Confirm the previous request</h2>
          <p className="text-sm">
            {reviewLabel(pending.kind)} may already have been saved. Confirm its exact request
            before taking another action. Refreshing alone does not confirm it.
          </p>
          <Button disabled={busy} onClick={() => void execute(pending, true).catch(() => {})}>
            Confirm previous request
          </Button>
        </section>
      )}
      {!ready && !pending && !error && <p role="status">Loading current review…</p>}
      {review && frozen && state && (
        <div className="border rounded-xl overflow-hidden" style={box}>
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
            <ReviewSection title="Submitted Dataset">
              {frozen.dependenciesChanged && (
                <p role="alert">
                  Current category or source facts differ from this submission. The frozen labels
                  below are preserved; the backend checks current dependencies before approval.
                </p>
              )}
              <ReviewFacts
                rows={[
                  [
                    'What was uploaded',
                    DATASET_UPLOAD_CHOICES.find((item) => item.value === frozen.uploadChoice)
                      ?.label,
                  ],
                  [
                    'Main types of data',
                    frozen.metadata.modalities
                      ?.map(
                        (value) => DATASET_MODALITIES.find((item) => item.value === value)?.label
                      )
                      .join(', '),
                  ],
                  ['Collection boundary', frozen.metadata.collectionBoundary],
                  [
                    'Geographic coverage at submission · supplier declared',
                    formatDatasetGeographicCoverage(frozen.metadata.geographicCoverage),
                  ],
                  [
                    'Collection or capture period at submission · supplier declared',
                    formatDatasetCollectionPeriod(frozen.metadata.collectionPeriod),
                  ],
                  ['License', frozen.common.license],
                  ['Overview', frozen.common.overview],
                  ['Description', frozen.common.description],
                  ['Quality statement', frozen.common.dataQuality],
                  [
                    'Primary category at submission',
                    frozen.common.categories.find(
                      (item) => item.id === frozen.common.primaryCategoryId
                    )?.name,
                  ],
                  [
                    'Other categories at submission',
                    frozen.common.categories
                      .filter((item) => item.id !== frozen.common.primaryCategoryId)
                      .map((item) => item.name)
                      .join(', ') || 'None recorded',
                  ],
                  ['Source at submission', frozen.common.source.name],
                  ['Source description at submission', frozen.common.source.description],
                  ['Source website recorded at submission', frozen.common.source.websiteUrl],
                  [
                    'Source verification at submission',
                    frozen.common.source.isVerifiedAtFreeze
                      ? 'Recorded as verified'
                      : 'Not recorded as verified',
                  ],
                  [
                    'Statistical study structure',
                    frozen.common.superType
                      ? reviewLabel(frozen.common.superType)
                      : 'Not specified',
                  ],
                  ['Tags', frozen.common.tags.join(', ')],
                  ['Common limitations', frozen.common.limitations],
                  ['Common methodology', frozen.common.methodology],
                  ['Common use cases', frozen.common.useCases],
                ]}
              />
              <details className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
                <summary className="cursor-pointer font-medium">
                  Scoped collection, sample and modality details
                </summary>
                <div className="mt-4 space-y-4">
                  <p className="text-sm">
                    These are supplier declarations. Sample inspection does not establish that
                    unseen full material has been inspected. Unknown quantities remain unknown.
                  </p>
                  <ReviewContentMetadata metadata={frozen.metadata} />
                </div>
              </details>
            </ReviewSection>
            <ReviewSection title="Review record" className="border-t lg:border-t-0 lg:border-l">
              <ReviewFacts
                rows={[
                  ['Frozen at', new Date(frozen.frozenAt).toLocaleString()],
                  ['Selected file references', frozen.selectedFiles],
                  ['Price at submission', priceLabel(frozen.pricingAtSubmission)],
                  ['Pricing revision at submission', frozen.pricingReference.revision],
                  ['Dataset status', reviewLabel(state.datasetStatus)],
                  ['Admin review status', reviewLabel(state.verificationStatus)],
                  [
                    'Assignment',
                    review.assignment
                      ? ownAssignment
                        ? 'Assigned to you'
                        : 'Assigned to another administrator'
                      : 'Unassigned',
                  ],
                  ['Current review feedback', review.reviewFeedback?.notes],
                  ['Rejection reason', review.reviewFeedback?.rejectionReason],
                ]}
              />
              {!review.assignment &&
                canPick &&
                ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(state.verificationStatus) && (
                  <Button disabled={locked} onClick={() => void pick().catch(() => {})}>
                    Pick for review
                  </Button>
                )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Approval preserves the supplier’s separate publication action. It does not publish
                this Dataset.
              </p>
            </ReviewSection>
          </div>
          <ReviewSection title="Submitted files and relationships" className="border-t">
            <ContentReviewInventory
              key={signature}
              review={review}
              actorId={actorId}
              locked={locked}
            />
          </ReviewSection>
          <div
            className="grid lg:grid-cols-2 border-t"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <ReviewSection title="Current pricing review">
              {state.pricing ? (
                <>
                  <ReviewFacts
                    rows={[
                      ['Current price', priceLabel(state.pricing)],
                      ['Current pricing status', reviewLabel(state.pricing.status)],
                      ['Current pricing revision', state.pricing.revision],
                      ['Pricing feedback', state.pricing.notes],
                      ['Pricing rejection reason', state.pricing.rejectionReason],
                    ]}
                  />
                  <p className="text-sm">
                    Decide pricing first when both pricing and Dataset need review. Each decision
                    refreshes the current references. A paid Dataset needs approved pricing before
                    Dataset approval.
                  </p>
                  <ReviewDecisionForm
                    key={'price:' + signature}
                    review={review}
                    actorId={actorId}
                    target="PRICE"
                    permissions={actions}
                    disabled={
                      locked ||
                      !ownAssignment ||
                      !['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(state.pricing.status)
                    }
                    execute={execute}
                  />
                </>
              ) : (
                <p>No current pricing record.</p>
              )}
            </ReviewSection>
            <ReviewSection
              title="Dataset review decision"
              className="border-t lg:border-t-0 lg:border-l"
            >
              <p className="text-sm">
                Decisions apply to this exact frozen submission. Required file security, capacity,
                dependency and recovery checks remain enforced by the backend.
              </p>
              {!ownAssignment && (
                <p className="text-sm">This review must be assigned to you before deciding.</p>
              )}
              <ReviewDecisionForm
                key={'dataset:' + signature}
                review={review}
                actorId={actorId}
                target="DATASET"
                permissions={actions}
                approveDisabled={Boolean(
                  state.pricing?.isPaid && state.pricing.status !== 'ACTIVE'
                )}
                disabled={locked || !ownAssignment || !underReview}
                execute={execute}
              />
            </ReviewSection>
          </div>
          <ReviewSection title="Published material and assessment" className="border-t">
            <ContentPublishedReview
              key={'published:' + signature}
              review={review}
              actorId={actorId}
              locked={locked}
              canAssess={can({ anyOf: [PERMISSIONS.DATASETS.EDIT_METADATA] })}
              execute={execute}
            />
          </ReviewSection>
          <ReviewSection title="KDTS assessment of submitted material" className="border-t">
            <ContentAssessment
              key={'assessment:' + signature}
              state={review.state}
              contentId={review.submittedContent.id}
              target="REVIEWED"
              current={snapshot.assessment.assessment}
              actorId={actorId}
              disabled={locked || !can({ anyOf: [PERMISSIONS.DATASETS.EDIT_METADATA] })}
              execute={execute}
            />
          </ReviewSection>
        </div>
      )}
    </div>
  );
}

function ReviewDecisionForm({
  review,
  actorId,
  target,
  permissions,
  disabled,
  approveDisabled = false,
  execute,
}: {
  review: AdminDatasetReview;
  actorId: string;
  target: 'PRICE' | 'DATASET';
  permissions: Record<Decision, boolean>;
  disabled: boolean;
  approveDisabled?: boolean;
  execute: Execute;
}) {
  const [choice, setChoice] = useState<Decision | null>(null),
    [notes, setNotes] = useState('');
  const labels = { APPROVE: 'Approve', REJECT: 'Reject', CHANGES: 'Request changes' };
  async function recordDecision() {
    const state = review.state;
    if (
      !choice ||
      disabled ||
      !permissions[choice] ||
      (choice === 'APPROVE' && approveDisabled) ||
      !state.pricing ||
      !state.reviewedContentId ||
      !notes.trim()
    )
      return;
    const body = {
      requestId: crypto.randomUUID(),
      expectedWorkflowRevision: state.workflowRevision,
      expectedReviewedContentId: state.reviewedContentId,
      expectedPricingReference: { id: state.pricing.id, revision: state.pricing.revision },
      notes: notes.trim(),
      ...(choice === 'REJECT'
        ? { rejectionReason: notes.trim() }
        : choice === 'CHANGES'
          ? { changeRationale: notes.trim() }
          : {}),
    };
    const kind =
      target === 'PRICE'
        ? ({ APPROVE: 'PRICE_APPROVE', REJECT: 'PRICE_REJECT', CHANGES: 'PRICE_CHANGES' } as const)[
            choice
          ]
        : choice;
    // The durable command parser applies the exact action schema before storage.
    await execute(
      DatasetReviewCommandSchema.parse({ kind, actorId, datasetId: state.datasetId, body })
    );
    setChoice(null);
    setNotes('');
  }
  const name = target === 'PRICE' ? 'pricing' : 'Dataset';
  return (
    <div className="space-y-3" aria-label={name + ' decisions'}>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(labels) as Decision[])
          .filter((action) => permissions[action])
          .map((action) => (
            <Button
              variant="outline"
              key={action}
              disabled={disabled || (action === 'APPROVE' && approveDisabled)}
              onClick={() => setChoice(action)}
            >
              {labels[action]} {name}
            </Button>
          ))}
      </div>
      {choice && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void recordDecision().catch(() => {});
          }}
        >
          <label htmlFor={target + '-decision-feedback'} className="block text-sm">
            {labels[choice]} {name}: feedback
            <Textarea
              id={target + '-decision-feedback'}
              aria-label={name + ' decision feedback'}
              required
              maxLength={4000}
              value={notes}
              disabled={disabled}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <p className="text-sm">This records your {name} decision for the displayed submission.</p>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={disabled || (choice === 'APPROVE' && approveDisabled) || !notes.trim()}
            >
              Confirm {labels[choice].toLowerCase()} {name}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => setChoice(null)}
            >
              Cancel decision
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
