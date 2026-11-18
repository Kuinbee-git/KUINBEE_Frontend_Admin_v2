'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CircleAlert, ClipboardCheck, RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DATASET_UPLOAD_CHOICES,
  DATASET_MODALITIES,
  formatDatasetGeographicCoverage,
  formatDatasetCollectionPeriod,
} from '@kuinbee/dataset-preparation-contracts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  StatusBadge,
  getDatasetStatusSemantic,
  getVerificationStatusSemantic,
} from '@/components/shared/StatusBadge';
import { DATASET_REVIEW_ACCESS } from '@/lib/authorization/route-access';
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
  formatReviewPricePerFile,
} from './ContentReviewFacts';

type Decision = 'APPROVE' | 'REJECT' | 'CHANGES';
type Execute = (command: DatasetReviewCommand, replay?: boolean) => Promise<void>;
const priceLabel = (price: { isPaid: boolean; price: string | null; currency: string }) =>
  price.isPaid ? `${price.price} ${price.currency}` : 'Free';
const card = 'rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]';
const subdued = 'text-sm text-[var(--text-muted)]';
const decisions = {
  APPROVE: {
    label: 'Approve',
    icon: Check,
    confirm: 'Confirm approval',
    style:
      'bg-[var(--action-success)] text-[var(--action-on-status)] shadow-sm hover:bg-[var(--action-success)] hover:text-[var(--action-on-status)] hover:brightness-90',
  },
  CHANGES: {
    label: 'Request changes',
    icon: CircleAlert,
    confirm: 'Confirm change request',
    style:
      'border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)] hover:bg-[var(--status-warning-bg)] hover:text-[var(--status-warning)] hover:brightness-95',
  },
  REJECT: {
    label: 'Reject',
    icon: X,
    confirm: 'Confirm rejection',
    style:
      'border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] hover:text-[var(--status-error)] hover:brightness-95',
  },
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
  const assessment = snapshot?.assessment.assessment;
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
  const openReview =
    state && ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(state.verificationStatus);
  const pricePending =
    state?.pricing && ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(state.pricing.status);
  const needsPriceApproval = Boolean(state?.pricing?.isPaid && state.pricing.status !== 'ACTIVE');
  const offer = frozen?.metadata.fullCollectionOffer;
  const sampleOnly = frozen?.uploadChoice === 'SAMPLE_ONLY';
  const commercialPrice = offer?.pricePerFile
    ? formatReviewPricePerFile(offer.pricePerFile)
    : offer
      ? 'Price on request'
      : state?.pricing
        ? sampleOnly
          ? 'Free sample'
          : priceLabel(state.pricing)
        : 'Not recorded';
  const material = DATASET_UPLOAD_CHOICES.find(
    (entry) => entry.value === frozen?.uploadChoice
  )?.label;
  const sections = [
    ['overview', 'Overview'],
    ['files', 'Files'],
    ['pricing', 'Pricing'],
    ['assessment', 'Assessment'],
    ...(state?.publishedContentId ? [['published', 'Published listing']] : []),
  ];
  const canAssess = can({ anyOf: [PERMISSIONS.DATASETS.EDIT_METADATA] });

  return (
    <div className="mx-auto max-w-7xl space-y-5" data-content-review={datasetId}>
      <nav
        aria-label="Dataset review navigation"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]"
      >
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() =>
            router.push(
              queueType === 'update-requests'
                ? '/dashboard/update-requests'
                : '/dashboard/proposals'
            )
          }
        >
          <ArrowLeft aria-hidden /> Back to review queue
        </Button>
        {can(DATASET_REVIEW_ACCESS) && (
          <Link
            href="/dashboard/supplier-datasets"
            className="rounded-sm underline-offset-4 hover:underline"
          >
            Supplier Datasets
          </Link>
        )}
      </nav>

      <header className={card + ' p-5 sm:p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-52">
            {state && (
              <p className="text-xs font-medium text-[var(--text-muted)]">
                {state.datasetUniqueId}
              </p>
            )}
            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {frozen?.common.title ?? 'Dataset review'}
            </h1>
            {frozen && (
              <p className={'mt-2 ' + subdued}>
                Supplier submission ·{' '}
                {new Date(review?.reviewFeedback?.submittedAt ?? frozen.frozenAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw className={busy ? 'animate-spin' : undefined} aria-hidden /> Refresh current
            review
          </Button>
        </div>
        {state && frozen && (
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <ReviewMetric label="Listing status">
              <StatusBadge
                status={reviewLabel(state.datasetStatus)}
                semanticType={getDatasetStatusSemantic(state.datasetStatus)}
              />
            </ReviewMetric>
            <ReviewMetric label="Review status">
              <StatusBadge
                status={reviewLabel(state.verificationStatus)}
                semanticType={getVerificationStatusSemantic(state.verificationStatus)}
              />
            </ReviewMetric>
            <ReviewMetric label="Submission">
              {material} · {frozen.selectedFiles} {frozen.selectedFiles === 1 ? 'file' : 'files'}
            </ReviewMetric>
            <ReviewMetric label={offer ? 'Full collection offer' : 'Price'}>
              {commercialPrice}
            </ReviewMetric>
            <ReviewMetric label="KDTS assessment">
              {assessment?.finalScore ?? 'Not assessed'}
            </ReviewMetric>
          </dl>
        )}
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] p-4 text-sm text-[var(--status-error)]"
        >
          {error}
        </p>
      )}
      {pending && (
        <section
          className="space-y-3 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-4"
          aria-label="Unconfirmed review request"
        >
          <h2 className="font-semibold">Confirm the previous request</h2>
          <p className="text-sm">
            {reviewLabel(pending.kind)} may already have been saved. Confirm its exact request
            before taking another action.
          </p>
          <Button disabled={busy} onClick={() => void execute(pending, true).catch(() => {})}>
            Confirm previous request
          </Button>
        </section>
      )}
      {!ready && !pending && !error && <p role="status">Loading current review…</p>}

      {review && frozen && state && (
        <>
          <nav aria-label="Review sections" className="flex flex-wrap gap-2">
            {sections.map(([anchor, title]) => (
              <a
                key={anchor}
                href={'#' + anchor}
                className="rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--bg-hover)]"
              >
                {title}
              </a>
            ))}
          </nav>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <aside
              className={
                'min-w-0 self-start xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 ' + card
              }
            >
              <ReviewSection title="Dataset review decision">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-[var(--text-muted)]" aria-hidden />
                  <span className="text-sm font-medium">
                    {state.verificationStatus === 'CHANGES_REQUESTED'
                      ? 'Waiting for supplier changes'
                      : review.assignment
                        ? ownAssignment
                          ? 'Assigned to you'
                          : 'Assigned to another administrator'
                        : openReview
                          ? 'Unassigned'
                          : 'Review complete'}
                  </span>
                </div>
                {!review.assignment && canPick && openReview && (
                  <Button disabled={locked} onClick={() => void pick().catch(() => {})}>
                    Pick for review
                  </Button>
                )}
                {openReview && (
                  <>
                    {review.assignment && !ownAssignment && (
                      <p className={subdued}>The assigned reviewer can record a decision.</p>
                    )}
                    {ownAssignment && underReview && (
                      <p className={subdued}>
                        After approval and KDTS assessment, the supplier can publish once all
                        requirements are met.
                      </p>
                    )}
                    {needsPriceApproval && (
                      <p className="text-sm text-[var(--status-warning)]">
                        Approve the{' '}
                        <a href="#pricing" className="underline">
                          pricing
                        </a>{' '}
                        before approving this paid dataset.
                      </p>
                    )}
                    <ReviewDecisionForm
                      key={'dataset:' + signature}
                      review={review}
                      actorId={actorId}
                      target="DATASET"
                      permissions={actions}
                      approveDisabled={needsPriceApproval}
                      disabled={locked || !ownAssignment || !underReview}
                      execute={execute}
                    />
                  </>
                )}
                {state.verificationStatus === 'VERIFIED' && !state.publishedContentId && (
                  <p className={subdued}>
                    {assessment
                      ? 'Approval is complete. The supplier can check publication readiness.'
                      : 'Approval is complete. Complete the KDTS assessment before publication.'}
                  </p>
                )}
                {state.datasetStatus === 'PUBLISHED' && (
                  <p className={subdued}>
                    This listing has been published.{' '}
                    <a href="#published" className="underline">
                      Inspect the published revision
                    </a>
                    .
                  </p>
                )}
                {(review.reviewFeedback?.notes || review.reviewFeedback?.rejectionReason) && (
                  <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
                    <ReviewFacts
                      rows={[
                        ['Review feedback', review.reviewFeedback.notes],
                        ['Rejection reason', review.reviewFeedback.rejectionReason],
                      ]}
                    />
                  </div>
                )}
              </ReviewSection>
            </aside>
            <div className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-1">
              <ReviewSection
                id="overview"
                title="Submission overview"
                className={'scroll-mt-4 ' + card}
              >
                {frozen.dependenciesChanged && (
                  <p
                    role="alert"
                    className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-sm text-[var(--status-warning)]"
                  >
                    Category or source details changed after submission. Refresh and check the
                    current dependencies before deciding.
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {frozen.common.overview}
                </p>
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-4">
                  <ReviewFacts
                    rows={[
                      [
                        'Data types',
                        frozen.metadata.modalities
                          ?.map(
                            (value) =>
                              DATASET_MODALITIES.find((item) => item.value === value)?.label
                          )
                          .join(', '),
                      ],
                      [
                        'Primary category',
                        frozen.common.categories.find(
                          (item) => item.id === frozen.common.primaryCategoryId
                        )?.name,
                      ],
                      [
                        'Other categories',
                        frozen.common.categories
                          .filter((item) => item.id !== frozen.common.primaryCategoryId)
                          .map((item) => item.name)
                          .join(', '),
                      ],
                      ['License', frozen.common.license],
                      ['Source', frozen.common.source.name],
                      [
                        'Source verification',
                        frozen.common.source.isVerifiedAtFreeze
                          ? 'Recorded as verified'
                          : 'Not recorded as verified',
                      ],
                      ['Source description', frozen.common.source.description],
                      ['Source website', frozen.common.source.websiteUrl],
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {frozen.common.description}
                  </p>
                </div>
                <ReviewFacts
                  rows={[
                    ['Collection scope', frozen.metadata.collectionBoundary],
                    [
                      'Geography · supplier declared',
                      formatDatasetGeographicCoverage(frozen.metadata.geographicCoverage),
                    ],
                    [
                      'Collection period · supplier declared',
                      formatDatasetCollectionPeriod(frozen.metadata.collectionPeriod),
                    ],
                    ['Quality statement', frozen.common.dataQuality],
                    ['Methodology', frozen.common.methodology],
                    ['Use cases', frozen.common.useCases],
                    ['Limitations', frozen.common.limitations],
                    [
                      'Study structure',
                      frozen.common.superType
                        ? reviewLabel(frozen.common.superType)
                        : 'Not specified',
                    ],
                    ['Tags', frozen.common.tags.join(', ')],
                  ]}
                />
                <details className="border-t border-[var(--border-default)] pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Scoped collection, sample and modality details
                  </summary>
                  <div className="mt-4">
                    <ReviewContentMetadata metadata={frozen.metadata} />
                  </div>
                </details>
              </ReviewSection>
              <ReviewSection
                id="files"
                title="Submitted files and relationships"
                className={'scroll-mt-4 ' + card}
              >
                <ContentReviewInventory
                  key={signature}
                  review={review}
                  actorId={actorId}
                  locked={locked}
                />
              </ReviewSection>
              <ReviewSection
                id="pricing"
                title="Pricing and buyer access"
                className={'scroll-mt-4 ' + card}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-4">
                    <p className={subdued}>
                      {sampleOnly ? 'Evaluation sample' : 'Marketplace access'}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {state.pricing ? priceLabel(state.pricing) : 'Not recorded'}
                    </p>
                    {state.pricing && (
                      <p className={'mt-1 ' + subdued}>
                        {sampleOnly
                          ? 'Free download for signed-in buyers.'
                          : state.pricing.isPaid
                            ? 'Checkout for the uploaded full dataset.'
                            : 'Free access to the uploaded full dataset.'}
                      </p>
                    )}
                  </div>
                  {offer && (
                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-4">
                      <p className={subdued}>Full collection · enquiry only</p>
                      <p className="mt-1 text-lg font-semibold">{commercialPrice}</p>
                      <p className={'mt-1 ' + subdued}>{offer.terms}</p>
                    </div>
                  )}
                </div>
                {state.pricing && (
                  <ReviewFacts
                    rows={[
                      [
                        'Current price status',
                        <StatusBadge
                          key="pricing-status"
                          status={reviewLabel(state.pricing.status)}
                          semanticType={
                            state.pricing.status === 'ACTIVE'
                              ? 'success'
                              : getVerificationStatusSemantic(state.pricing.status)
                          }
                        />,
                      ],
                      ['Current pricing revision', state.pricing.revision],
                      ['Access pricing at submission', priceLabel(frozen.pricingAtSubmission)],
                      ['Pricing revision at submission', frozen.pricingReference.revision],
                      ['Pricing feedback', state.pricing.notes],
                      ['Pricing rejection reason', state.pricing.rejectionReason],
                    ]}
                  />
                )}
                {pricePending && (
                  <div className="space-y-3 border-t border-[var(--border-default)] pt-4">
                    <h3 className="font-medium">Pricing decision</h3>
                    <ReviewDecisionForm
                      key={'price:' + signature}
                      review={review}
                      actorId={actorId}
                      target="PRICE"
                      permissions={actions}
                      disabled={locked || !ownAssignment}
                      execute={execute}
                    />
                  </div>
                )}
              </ReviewSection>
              <ReviewSection
                id="assessment"
                title="KDTS assessment"
                className={'scroll-mt-4 ' + card}
              >
                <ContentAssessment
                  key={'assessment:' + signature}
                  state={state}
                  contentId={frozen.id}
                  target="REVIEWED"
                  current={assessment ?? null}
                  actorId={actorId}
                  disabled={locked || !canAssess}
                  execute={execute}
                />
              </ReviewSection>
              <ReviewSection
                id="published"
                title="Published listing"
                className={'scroll-mt-4 ' + card}
              >
                <ContentPublishedReview
                  key={'published:' + signature}
                  review={review}
                  actorId={actorId}
                  locked={locked}
                  canAssess={canAssess}
                  execute={execute}
                />
              </ReviewSection>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReviewMetric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] px-3 py-2.5">
      <dt className="text-xs font-medium text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold">{children}</dd>
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
  const choices = Object.entries(decisions) as [Decision, (typeof decisions)[Decision]][];
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
  const actionText = (action: Decision) =>
    action === 'CHANGES'
      ? target === 'PRICE'
        ? 'Request pricing changes'
        : 'Request changes'
      : decisions[action].label + ' ' + name;
  return (
    <div className="space-y-3" aria-label={name + ' decisions'}>
      <div className="flex flex-wrap gap-2">
        {choices
          .filter(([action]) => permissions[action])
          .map(([action, { icon: Icon, style }]) => (
            <Button
              variant="ghost"
              size="sm"
              className={style}
              key={action}
              disabled={disabled || (action === 'APPROVE' && approveDisabled)}
              onClick={() => setChoice(action)}
            >
              <Icon aria-hidden /> {actionText(action)}
            </Button>
          ))}
      </div>
      {choice && (
        <form
          className="space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void recordDecision().catch(() => {});
          }}
        >
          <label htmlFor={target + '-decision-feedback'} className="block text-sm">
            Feedback for the supplier
            <Textarea
              id={target + '-decision-feedback'}
              aria-label={name + ' decision feedback'}
              required
              autoFocus
              maxLength={4000}
              value={notes}
              disabled={disabled}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className={decisions[choice].style}
              disabled={disabled || (choice === 'APPROVE' && approveDisabled) || !notes.trim()}
            >
              {decisions[choice].confirm}
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
