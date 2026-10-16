'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  DATASET_UPLOAD_CHOICES,
  DATASET_MODALITIES,
  formatDatasetGeographicCoverage,
  formatDatasetCollectionPeriod,
} from '@kuinbee/dataset-preparation-contracts';
import { datasetContentApi, type AdminDatasetReview } from '@/services/dataset-content.service';
import type { DatasetReviewCommand } from '@/lib/datasets/dataset-review-commands';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { ContentAssessment } from './ContentAssessment';
import { ContentReviewInventory } from './ContentReviewInventory';
import { ReviewFacts, ReviewContentMetadata } from './ContentReviewFacts';

type Props = {
  review: AdminDatasetReview;
  actorId: string;
  locked: boolean;
  canAssess: boolean;
  execute: (command: DatasetReviewCommand, replay?: boolean) => Promise<void>;
};

export function ContentPublishedReview(props: Props) {
  const [open, setOpen] = useState(false);
  if (!props.review.state.publishedContentId)
    return (
      <p className="text-sm">
        No current publication is selected. Retained submissions and historical access references
        remain separate.
      </p>
    );
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer font-medium">Inspect current published material</summary>
      {open && <PublishedContent {...props} />}
    </details>
  );
}

function PublishedContent({ review, actorId, locked, canAssess, execute }: Props) {
  const selected = review.state;
  const result = useQuery({
    queryKey: [
      'dataset-admin-published',
      actorId,
      selected.datasetId,
      selected.workflowRevision,
      selected.publishedContentId,
    ],
    enabled: !locked,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      const [published, assessment] = await Promise.all([
        datasetContentApi.publishedReview(selected.datasetId, signal),
        datasetContentApi.assessment(selected.datasetId, 'PUBLISHED', signal),
      ]);
      if (
        published.state.workflowRevision !== selected.workflowRevision ||
        assessment.state.workflowRevision !== selected.workflowRevision ||
        !published.publishedContent ||
        published.publishedContent.id !== selected.publishedContentId ||
        assessment.state.publishedContentId !== selected.publishedContentId
      )
        throw new Error(
          'The publication or review changed while loading. Refresh current review before continuing.'
        );
      return { published, assessment };
    },
  });
  if (locked)
    return (
      <p className="mt-4 text-sm">
        Confirm the pending request or refresh current review before inspecting published material.
      </p>
    );
  if (result.isPending)
    return (
      <p className="mt-4" role="status">
        Loading exact published material…
      </p>
    );
  if (result.isError)
    return (
      <p className="mt-4" role="alert">
        {getFriendlyErrorMessage(result.error)} Refresh current review before continuing.
      </p>
    );
  const { published, assessment } = result.data,
    frozen = published.publishedContent!;
  const publication = published.publication!;
  return (
    <div className="mt-4 space-y-5" data-published-content={frozen.id}>
      <p className="text-sm">
        This is the exact published content. The submitted review above can describe a different
        correction. Saving this assessment does not approve or publish that correction.
      </p>
      {published.state.datasetStatus === 'PUBLISHED' && published.visibility === 'PUBLIC' && (
        <Link
          href={'/dashboard/questions?dataset=' + encodeURIComponent(selected.datasetId)}
          className="inline-block text-sm font-medium underline"
        >
          Manage existing Dataset questions
        </Link>
      )}
      <ReviewFacts
        rows={[
          ['Published title', frozen.common.title],
          [
            'What was uploaded',
            DATASET_UPLOAD_CHOICES.find((item) => item.value === frozen.uploadChoice)?.label,
          ],
          [
            'Main types of data',
            frozen.metadata.modalities
              ?.map((value) => DATASET_MODALITIES.find((item) => item.value === value)?.label)
              .join(', '),
          ],
          ['Published at', new Date(publication.publishedAt).toLocaleString()],
          ['Published content reference', frozen.id],
          [
            'Geographic coverage captured for published content · supplier declared',
            formatDatasetGeographicCoverage(frozen.metadata.geographicCoverage),
          ],
          [
            'Collection or capture period captured for published content · supplier declared',
            formatDatasetCollectionPeriod(frozen.metadata.collectionPeriod),
          ],
          ['License captured for published content', frozen.common.license],
          ['Overview captured for published content', frozen.common.overview],
          ['Description captured for published content', frozen.common.description],
          ['Quality statement captured for published content', frozen.common.dataQuality],
          [
            'Category captured for published content',
            frozen.common.categories.find((item) => item.id === frozen.common.primaryCategoryId)
              ?.name,
          ],
          ['Source captured for published content', frozen.common.source.name],
          [
            'Price at publication',
            publication.pricingAtPublication.isPaid
              ? `${publication.pricingAtPublication.price} ${publication.pricingAtPublication.currency}`
              : 'Free',
          ],
          ['Current Dataset status', published.state.datasetStatus],
          ['Current visibility', published.visibility],
        ]}
      />
      {frozen.dependenciesChanged && (
        <p className="text-sm">
          Current common facts differ from these captured published facts. The captured values are
          preserved.
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Published collection and modality declarations
        </summary>
        <div className="mt-3">
          <ReviewContentMetadata metadata={frozen.metadata} />
        </div>
      </details>
      <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <h3 className="font-semibold mb-3">Published files and relationships</h3>
        <ContentReviewInventory
          review={{ state: published.state, submittedContent: frozen }}
          actorId={actorId}
          locked={locked}
          target="PUBLISHED"
          publicationId={publication.id}
        />
      </div>
      <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        <h3 className="font-semibold mb-3">KDTS assessment of published material</h3>
        <ContentAssessment
          state={published.state}
          contentId={frozen.id}
          target="PUBLISHED"
          current={assessment.assessment}
          actorId={actorId}
          disabled={locked || !canAssess}
          execute={execute}
        />
      </div>
    </div>
  );
}
