import {
  DatasetWorkflowIdParamsSchema,
  DatasetAdminProposalsQuerySchema,
  DatasetAdminProposalsResponseSchema,
  DatasetAdminAssignmentsQuerySchema,
  DatasetAdminAssignmentsResponseSchema,
  DatasetReviewResponseSchema,
  DatasetWorkflowResponseSchema,
  DatasetReviewPickBodySchema,
  DatasetReviewApproveBodySchema,
  DatasetReviewRejectBodySchema,
  DatasetReviewChangesBodySchema,
  DatasetFrozenInventoryQuerySchema,
  DatasetFrozenInventoryResponseSchema,
  DatasetContentAssessmentQuerySchema,
  DatasetContentAssessmentBodySchema,
  DatasetContentAssessmentResponseSchema,
  DatasetPublicationResponseSchema,
  DatasetFileAccessContextQuerySchema,
  DatasetFileAccessContextSchema,
  DatasetFileAccessPageQuerySchema,
  DatasetFileAccessPageResponseSchema,
  DatasetFileObservationQuerySchema,
  DatasetFileObservationResponseSchema,
  DatasetFileDownloadBodySchema,
  DatasetFileDownloadResponseSchema,
  type DatasetAdminProposalsQuery,
  type DatasetAdminAssignmentsQuery,
  type DatasetWorkflowState,
  type DatasetReviewPickBody,
  type DatasetReviewApproveBody,
  type DatasetReviewRejectBody,
  type DatasetReviewChangesBody,
  type DatasetContentAssessmentBody,
  type DatasetFrozenInventoryQuery,
  type DatasetFileAccessSelection,
  type DatasetFileAccessPageQuery,
  type DatasetFileObservationQuery,
  type DatasetFileDownloadBody,
} from '@kuinbee/dataset-preparation-contracts';
import { apiClient } from '@/lib/api/client';
import { DATASET_CONTENT_ADMIN_ENABLED } from '@/lib/dataset-content-environment';

export type AdminDatasetReview = ReturnType<typeof DatasetReviewResponseSchema.parse>;
export type AdminDatasetInbox = ReturnType<typeof DatasetAdminProposalsResponseSchema.parse>;
export type AdminDatasetAssignments = ReturnType<
  typeof DatasetAdminAssignmentsResponseSchema.parse
>;
export type AdminDatasetFrozenInventory = ReturnType<
  typeof DatasetFrozenInventoryResponseSchema.parse
>;
export type AdminDatasetAssessment = ReturnType<
  typeof DatasetContentAssessmentResponseSchema.parse
>;
export type AdminDatasetPublication = ReturnType<typeof DatasetPublicationResponseSchema.parse>;
export type AdminDatasetFileInventory = ReturnType<
  typeof DatasetFileAccessPageResponseSchema.parse
>;
export type AdminDatasetObservations = ReturnType<
  typeof DatasetFileObservationResponseSchema.parse
>;
export type AdminDatasetReviewAction = 'PICK' | 'APPROVE' | 'REJECT' | 'CHANGES';
export type AdminDatasetPriceAction = Exclude<AdminDatasetReviewAction, 'PICK'>;
type ReviewBody =
  | DatasetReviewPickBody
  | DatasetReviewApproveBody
  | DatasetReviewRejectBody
  | DatasetReviewChangesBody;

export class DatasetContentApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 502
  ) {
    super(message);
  }
}
const incompatible = (): never => {
  throw new DatasetContentApiError(
    'The Dataset response does not match the selected review. Your input is retained; refresh before continuing.',
    'INCOMPATIBLE_DATASET_RESPONSE'
  );
};
const encodedId = (datasetId: string) =>
  encodeURIComponent(DatasetWorkflowIdParamsSchema.parse({ datasetId }).datasetId);
const base = (datasetId: string) => `/v2/admin/dataset-proposals/${encodedId(datasetId)}`;
const fileBase = (datasetId: string) => `/v2/admin/dataset-files/${encodedId(datasetId)}`;
async function request<T>(
  path: string,
  schema: { parse(value: unknown): T },
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    params?: Record<string, string | number | undefined>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  if (!DATASET_CONTENT_ADMIN_ENABLED)
    throw new DatasetContentApiError(
      'Dataset content review is not enabled in this environment.',
      'NOT_ENABLED',
      404
    );
  const response = await apiClient.request<unknown>(path, {
    method: 'GET',
    ...options,
    cache: 'no-store',
    timeoutMs: 30_000,
  });
  const envelope = response.data;
  if (
    !envelope ||
    typeof envelope !== 'object' ||
    !('success' in envelope) ||
    envelope.success !== true ||
    !('data' in envelope)
  )
    return incompatible();
  try {
    return schema.parse(envelope.data);
  } catch {
    return incompatible();
  }
}
const matchesDataset = (datasetId: string, state: DatasetWorkflowState) => {
  if (state.datasetId !== datasetId) incompatible();
};
const decisionSchema = (action: AdminDatasetReviewAction) =>
  action === 'PICK'
    ? DatasetReviewPickBodySchema
    : action === 'APPROVE'
      ? DatasetReviewApproveBodySchema
      : action === 'REJECT'
        ? DatasetReviewRejectBodySchema
        : DatasetReviewChangesBodySchema;
const actionPath = {
  PICK: 'pick',
  APPROVE: 'approve',
  REJECT: 'reject',
  CHANGES: 'request-changes',
} as const;
function matchesReceipt(
  datasetId: string,
  body: ReviewBody,
  response: ReturnType<typeof DatasetWorkflowResponseSchema.parse>,
  pricing: boolean
) {
  matchesDataset(datasetId, response.state);
  const state = response.state;
  if (
    response.requestId !== body.requestId ||
    state.workflowRevision !== body.expectedWorkflowRevision + 1 ||
    state.reviewedContentId !== body.expectedReviewedContentId ||
    (!pricing && state.activeContentId !== null) ||
    state.pricing?.id !== body.expectedPricingReference.id ||
    state.pricing.revision !== body.expectedPricingReference.revision + (pricing ? 1 : 0)
  )
    incompatible();
  return response;
}
function matchesFileContext(
  context: ReturnType<typeof DatasetFileAccessContextSchema.parse>,
  datasetId: string,
  query: {
    scope: string;
    component: string;
    contentId: string;
    contentGeneration: number;
    expectedWorkflowRevision?: number;
  }
) {
  if (
    context.datasetId !== datasetId ||
    context.scope !== 'REVIEWED' ||
    query.scope !== 'REVIEWED' ||
    context.component !== query.component ||
    context.contentId !== query.contentId ||
    context.contentGeneration !== query.contentGeneration ||
    context.workflowRevision !== query.expectedWorkflowRevision ||
    context.editOperation !== null ||
    !context.frozen
  )
    incompatible();
}
function assertReviewedQuery(query: {
  scope: string;
  expectedWorkflowRevision?: number;
  editOperation?: string;
}) {
  if (
    query.scope !== 'REVIEWED' ||
    query.expectedWorkflowRevision === undefined ||
    query.editOperation !== undefined
  )
    throw new DatasetContentApiError(
      'Select the exact reviewed content before requesting its files.',
      'INVALID_FILE_SCOPE',
      400
    );
}

// Writes return only their immutable receipt. Callers explicitly retain/replay
// the command and refresh current authority; no method retries or publishes.
export const datasetContentApi = {
  async inbox(input: Partial<DatasetAdminProposalsQuery>, signal?: AbortSignal) {
    const query = DatasetAdminProposalsQuerySchema.parse(input);
    const result = await request(
      '/v2/admin/dataset-proposals',
      DatasetAdminProposalsResponseSchema,
      { params: query, signal }
    );
    if (
      result.page !== query.page ||
      result.pageSize !== query.pageSize ||
      result.items.length > query.pageSize ||
      result.total < result.items.length
    )
      incompatible();
    return result;
  },
  async assignments(input: Partial<DatasetAdminAssignmentsQuery>, signal?: AbortSignal) {
    const query = DatasetAdminAssignmentsQuerySchema.parse(input);
    const result = await request(
      '/v2/admin/dataset-proposals/assignments',
      DatasetAdminAssignmentsResponseSchema,
      { params: query, signal }
    );
    if (
      result.page !== query.page ||
      result.pageSize !== query.pageSize ||
      result.items.length > query.pageSize ||
      result.total < result.items.length
    )
      incompatible();
    return result;
  },
  async review(datasetId: string, signal?: AbortSignal) {
    const result = await request(`${base(datasetId)}/review`, DatasetReviewResponseSchema, {
      signal,
    });
    matchesDataset(datasetId, result.state);
    if (result.submittedContent.id !== result.state.reviewedContentId) incompatible();
    return result;
  },
  async decision(
    datasetId: string,
    action: AdminDatasetReviewAction,
    supplied: ReviewBody,
    signal?: AbortSignal
  ) {
    const body = decisionSchema(action).parse(supplied);
    const result = matchesReceipt(
      datasetId,
      body,
      await request(`${base(datasetId)}/${actionPath[action]}`, DatasetWorkflowResponseSchema, {
        method: 'POST',
        body,
        signal,
      }),
      false
    );
    const status = result.state.verificationStatus,
      datasetStatus = result.state.datasetStatus;
    if (
      action === 'PICK'
        ? status !== 'UNDER_REVIEW' || datasetStatus !== 'UNDER_REVIEW'
        : action === 'APPROVE'
          ? status !== 'VERIFIED' || !['VERIFIED', 'DELISTED'].includes(datasetStatus)
          : action === 'REJECT'
            ? status !== 'REJECTED' || !['REJECTED', 'DELISTED'].includes(datasetStatus)
            : status !== 'CHANGES_REQUESTED' || datasetStatus !== 'SUBMITTED'
    )
      incompatible();
    return result;
  },
  async pricingDecision(
    datasetId: string,
    action: AdminDatasetPriceAction,
    supplied: ReviewBody,
    signal?: AbortSignal
  ) {
    const body = decisionSchema(action).parse(supplied);
    const result = matchesReceipt(
      datasetId,
      body,
      await request(
        `${base(datasetId)}/pricing/${actionPath[action]}`,
        DatasetWorkflowResponseSchema,
        { method: 'POST', body, signal }
      ),
      true
    );
    if (
      result.state.pricing!.status !==
      (action === 'APPROVE' ? 'ACTIVE' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED')
    )
      incompatible();
    return result;
  },
  async frozenInventory(
    datasetId: string,
    input: DatasetFrozenInventoryQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetFrozenInventoryQuerySchema.parse(input);
    const result = await request(
      `${base(datasetId)}/inventory`,
      DatasetFrozenInventoryResponseSchema,
      { params: query, signal }
    );
    if (
      result.datasetId !== datasetId ||
      result.workflowRevision !== query.expectedWorkflowRevision ||
      result.contentId !== query.contentId ||
      result.contentGeneration !== query.contentGeneration ||
      result.inventory !== query.inventory ||
      result.component !== (query.component ?? null) ||
      result.items.length > query.limit ||
      result.total < result.items.length ||
      result.items.some(
        (item, index) =>
          (query.afterId !== undefined && item.id <= query.afterId) ||
          (index > 0 && item.id <= result.items[index - 1]!.id)
      )
    )
      incompatible();
    return result;
  },
  async assessment(datasetId: string, target: 'REVIEWED' | 'PUBLISHED', signal?: AbortSignal) {
    const query = DatasetContentAssessmentQuerySchema.parse({ target });
    const result = await request(
      `${base(datasetId)}/assessment`,
      DatasetContentAssessmentResponseSchema,
      { params: query, signal }
    );
    if (result.state.datasetId !== datasetId || result.target !== target) incompatible();
    return result;
  },
  async assess(datasetId: string, supplied: DatasetContentAssessmentBody, signal?: AbortSignal) {
    const body = DatasetContentAssessmentBodySchema.parse(supplied);
    const result = await request(
      `${base(datasetId)}/assessment`,
      DatasetPublicationResponseSchema,
      { method: 'POST', body, signal }
    );
    const assessment = result.assessmentChange?.assessment;
    if (
      result.requestId !== body.requestId ||
      result.state.datasetId !== datasetId ||
      result.state.workflowRevision !== body.expectedWorkflowRevision + 1 ||
      !assessment ||
      result.assessmentChange!.target !== body.target ||
      assessment.contentId !== body.expectedContentId ||
      assessment.datasetId !== datasetId ||
      (['Q', 'L', 'P', 'U', 'F'] as const).some((key) => assessment[key] !== body[key])
    )
      incompatible();
    return result;
  },
  async fileContext(datasetId: string, input: DatasetFileAccessSelection, signal?: AbortSignal) {
    const query = DatasetFileAccessContextQuerySchema.parse(input);
    if (query.scope !== 'REVIEWED' || query.editOperation !== undefined)
      throw new DatasetContentApiError(
        'Choose exact reviewed files for admin review.',
        'INVALID_FILE_SCOPE',
        400
      );
    const result = await request(`${fileBase(datasetId)}/context`, DatasetFileAccessContextSchema, {
      params: query,
      signal,
    });
    if (
      result.datasetId !== datasetId ||
      result.scope !== 'REVIEWED' ||
      result.component !== query.component ||
      !result.frozen ||
      result.editOperation !== null
    )
      incompatible();
    return result;
  },
  async files(datasetId: string, input: DatasetFileAccessPageQuery, signal?: AbortSignal) {
    const query = DatasetFileAccessPageQuerySchema.parse(input);
    assertReviewedQuery(query);
    const result = await request(
      `${fileBase(datasetId)}/inventory`,
      DatasetFileAccessPageResponseSchema,
      { params: query, signal }
    );
    matchesFileContext(result.context, datasetId, query);
    if (
      result.items.length > query.limit ||
      result.items.some(
        (item, index) =>
          (query.afterId !== undefined && item.id <= query.afterId) ||
          (index > 0 && item.id <= result.items[index - 1]!.id)
      )
    )
      incompatible();
    if (result.nextCursor) {
      matchesFileContext(result.context, datasetId, result.nextCursor);
      if (
        result.nextCursor.afterId !== result.items.at(-1)?.id ||
        result.nextCursor.limit !== query.limit
      )
        incompatible();
    }
    return result;
  },
  async observations(datasetId: string, input: DatasetFileObservationQuery, signal?: AbortSignal) {
    const query = DatasetFileObservationQuerySchema.parse(input);
    assertReviewedQuery(query);
    const result = await request(
      `${fileBase(datasetId)}/observations`,
      DatasetFileObservationResponseSchema,
      { params: query, signal }
    );
    matchesFileContext(result.context, datasetId, query);
    if (
      result.memberId !== query.memberId ||
      result.evidenceId !== query.evidenceId ||
      result.items.length > query.limit ||
      result.items.some(
        (item, index) =>
          item.evidenceId !== query.evidenceId ||
          (query.afterId !== undefined && item.id <= query.afterId) ||
          (index > 0 && item.id <= result.items[index - 1]!.id)
      )
    )
      incompatible();
    if (result.nextCursor) {
      matchesFileContext(result.context, datasetId, result.nextCursor);
      if (
        result.nextCursor.memberId !== query.memberId ||
        result.nextCursor.evidenceId !== query.evidenceId ||
        result.nextCursor.afterId !== result.items.at(-1)?.id ||
        result.nextCursor.limit !== query.limit
      )
        incompatible();
    }
    return result;
  },
  async download(datasetId: string, supplied: DatasetFileDownloadBody, signal?: AbortSignal) {
    const body = DatasetFileDownloadBodySchema.parse(supplied);
    assertReviewedQuery(body);
    const result = await request(
      `${fileBase(datasetId)}/download-url`,
      DatasetFileDownloadResponseSchema,
      { method: 'POST', body, signal }
    );
    matchesFileContext(result.context, datasetId, body);
    if (result.memberId !== body.memberId || result.downloadIntentId !== body.downloadIntentId)
      incompatible();
    return result;
  },
};
