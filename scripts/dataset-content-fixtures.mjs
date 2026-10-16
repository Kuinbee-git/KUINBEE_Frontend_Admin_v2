// Synthetic canonical DTOs for adapter/UI tests. These never qualify native
// scanning, storage, access control, recovery or a hosted deployment.
import {
  DatasetReviewResponseSchema,
  DatasetPublishedReviewResponseSchema,
  DatasetContentAssessmentResponseSchema,
  DatasetFrozenInventoryResponseSchema,
} from '@kuinbee/dataset-preparation-contracts';
export const id = (value) => 'c' + String(value).padStart(24, '0');
export const actorId = id(1),
  otherActorId = id(2),
  now = '2026-10-16T00:00:00.000Z';
let sequence = 100;
export function seed(choice = 'FULL_AND_SAMPLE', count) {
  const datasetId = id(sequence++),
    contentId = id(sequence++),
    priceId = id(sequence++);
  const components =
    choice === 'FULL_AND_SAMPLE'
      ? ['FULL', 'SAMPLE']
      : [choice === 'SAMPLE_ONLY' ? 'SAMPLE' : 'FULL'];
  const common = {
    title: 'Review collection ' + choice,
    overview: 'A defined test collection',
    description: 'The frozen supplier description.',
    dataQuality: 'Supplier declared quality',
    license: 'CC-BY-4.0',
    primaryCategoryId: 'category',
    secondaryCategoryIds: [],
    sourceId: 'source',
    tags: [],
    categories: [{ id: 'category', name: 'Category at submission' }],
    source: {
      id: 'source',
      name: 'Source at submission',
      description: null,
      websiteUrl: null,
      isVerifiedAtFreeze: false,
    },
  };
  const metadata = {
    collectionBoundary: 'The defined collection, not unseen future additions.',
    modalities: ['AUDIO'],
    contexts: [],
    collectionMeasurements: [
      { metric: 'AUDIO_DURATION', state: 'KNOWN', value: '200', unit: 'HOUR' },
    ],
    ...(choice === 'FULL_ONLY'
      ? {}
      : {
          sampleMeasurements: [
            { metric: 'AUDIO_DURATION', state: 'KNOWN', value: '15', unit: 'MINUTE' },
          ],
          sample: {
            selectionMethod: 'Selected sessions',
            coverage: 'A subset of the represented collection',
          },
        }),
    ...(choice === 'SAMPLE_ONLY' ? {} : { fullCompleteness: true }),
    profiles: { audio: { content: 'SPEECH', languages: ['English'] } },
  };
  const state = {
    datasetId,
    datasetUniqueId: 'D' + datasetId.slice(-10),
    datasetStatus: 'SUBMITTED',
    verificationStatus: 'SUBMITTED',
    preparationGeneration: 1,
    workflowRevision: 1,
    activeContentId: null,
    reviewedContentId: contentId,
    publishedContentId: null,
    pricing: {
      id: priceId,
      revision: 1,
      status: 'SUBMITTED',
      isPaid: false,
      price: null,
      currency: 'INR',
      notes: null,
      rejectionReason: null,
      submittedAt: now,
      approvedAt: null,
      updatedAt: now,
    },
  };
  const members = Array.from({ length: count ?? components.length }, (_, index) => {
    const evidenceId = id(sequence++);
    return {
      id: id(sequence++),
      contentId,
      uploadObjectId: id(sequence++),
      component: components[index % components.length],
      role: 'PRIMARY',
      relativePath: null,
      groupId: null,
      originalFileName: 'selected-' + (index + 1) + '.wav',
      measuredSizeBytes: '48044',
      inspectionAtSubmissionId: evidenceId,
      inspection: {
        securityState: 'ACCEPTED',
        currentEvidenceId: evidenceId,
        recordedOutcome: 'PASS',
        current: true,
        eligibility: 'NOT_EVALUATED',
      },
    };
  });
  return {
    state,
    assignment: null,
    assessment: null,
    members,
    submittedContent: {
      id: contentId,
      generation: 1,
      frozenAt: now,
      common,
      metadata,
      uploadChoice: choice,
      pricingReference: { id: priceId, revision: 1 },
      pricingAtSubmission: { isPaid: false, price: null, currency: 'INR' },
      dependencyFingerprint: 'a'.repeat(64),
      dependenciesChanged: false,
      selectedFiles: members.length,
    },
    reviewFeedback: {
      notes: null,
      rejectionReason: null,
      submittedAt: now,
      verifiedAt: null,
      rejectedAt: null,
    },
  };
}
export const review = (model) =>
  DatasetReviewResponseSchema.parse({
    state: model.state,
    assignment: model.assignment,
    submittedContent: model.submittedContent,
    reviewFeedback: model.reviewFeedback,
  });
export function assessment(model, target = 'REVIEWED') {
  const pricing = Object.fromEntries(
    Object.entries(model.state.pricing).filter(
      ([key]) =>
        !['notes', 'rejectionReason', 'submittedAt', 'approvedAt', 'updatedAt'].includes(key)
    )
  );
  return DatasetContentAssessmentResponseSchema.parse({
    state: { ...model.state, pricing },
    target,
    assessment:
      target === 'PUBLISHED'
        ? model.state.publishedContentId
          ? (model.published?.assessment ?? null)
          : null
        : model.assessment,
  });
}
export function inventory(model, query) {
  const items =
    query.inventory === 'FILES'
      ? model.members.filter((item) => !query.component || item.component === query.component)
      : [];
  const selected = items
    .filter((item) => !query.afterId || item.id > query.afterId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const page = selected.slice(0, query.limit);
  const cursor = { ...query };
  delete cursor.limit;
  return DatasetFrozenInventoryResponseSchema.parse({
    datasetId: model.state.datasetId,
    workflowRevision: model.state.workflowRevision,
    contentId: model.submittedContent.id,
    contentGeneration: model.submittedContent.generation,
    frozenAt: model.submittedContent.frozenAt,
    inventory: query.inventory,
    component: query.component ?? null,
    total: items.length,
    items: page,
    nextCursor: selected.length > page.length ? { ...cursor, afterId: page.at(-1).id } : null,
  });
}

export function attachPublished(model) {
  const content = structuredClone(model.submittedContent),
    members = structuredClone(model.members);
  content.metadata.geographicCoverage = {
    state: 'KNOWN',
    description: 'Published A declared region',
  };
  content.metadata.collectionPeriod = {
    state: 'KNOWN',
    start: { precision: 'YEAR', value: '2019' },
    end: { precision: 'MONTH', value: '2020-04' },
  };
  model.submittedContent.metadata.geographicCoverage = { state: 'UNKNOWN' };
  model.submittedContent.metadata.collectionPeriod = { state: 'NOT_APPLICABLE' };
  const rating = {
    id: id(sequence++),
    datasetId: model.state.datasetId,
    contentId: content.id,
    Q: 80,
    L: 80,
    P: 80,
    U: 80,
    F: 80,
    finalScore: '80.00',
    adminId: actorId,
    createdAt: now,
    note: 'Published A assessment',
    scope: {
      uploadedComponents: [...new Set(members.map((member) => member.component))],
      representedCollection: 'SUPPLIER_DECLARATION',
    },
  };
  model.published = {
    content,
    members,
    assessment: rating,
    publication: {
      id: id(sequence++),
      contentId: content.id,
      publishedAt: now,
      pricingReference: structuredClone(content.pricingReference),
      pricingAtPublication: structuredClone(content.pricingAtSubmission),
      assessmentAtPublicationId: rating.id,
      currentAssessmentId: rating.id,
    },
  };
  model.state.publishedContentId = content.id;
  model.state.datasetStatus = 'UNDER_REVIEW';
  model.state.verificationStatus = 'UNDER_REVIEW';
  model.assignment = { id: id(sequence++), adminId: actorId, status: 'ACTIVE', assignedAt: now };
  model.submittedContent.id = id(sequence++);
  model.state.reviewedContentId = model.submittedContent.id;
  model.submittedContent.common.overview = 'New reviewed B overview';
  model.members = model.members.map((member) => ({
    ...member,
    id: id(sequence++),
    contentId: model.submittedContent.id,
  }));
  return model;
}
export function publishedReview(model) {
  const current = model.state.publishedContentId ? model.published : null;
  return DatasetPublishedReviewResponseSchema.parse({
    state: assessment(model).state,
    visibility: 'PRIVATE',
    publishedContent: current?.content ?? null,
    publication: current?.publication ?? null,
  });
}
