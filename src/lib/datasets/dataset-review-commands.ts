import { z } from 'zod';
import {
  DatasetReviewPickBodySchema,
  DatasetReviewApproveBodySchema,
  DatasetReviewRejectBodySchema,
  DatasetReviewChangesBodySchema,
  DatasetContentAssessmentBodySchema,
} from '@kuinbee/dataset-preparation-contracts';
import { datasetContentApi } from '@/services/dataset-content.service';

const id = z.string().cuid();
const identity = { actorId: id, datasetId: id };
export const DatasetReviewCommandSchema = z.discriminatedUnion('kind', [
  z.object({ ...identity, kind: z.literal('PICK'), body: DatasetReviewPickBodySchema }).strict(),
  z
    .object({ ...identity, kind: z.literal('APPROVE'), body: DatasetReviewApproveBodySchema })
    .strict(),
  z
    .object({ ...identity, kind: z.literal('REJECT'), body: DatasetReviewRejectBodySchema })
    .strict(),
  z
    .object({ ...identity, kind: z.literal('CHANGES'), body: DatasetReviewChangesBodySchema })
    .strict(),
  z
    .object({ ...identity, kind: z.literal('PRICE_APPROVE'), body: DatasetReviewApproveBodySchema })
    .strict(),
  z
    .object({ ...identity, kind: z.literal('PRICE_REJECT'), body: DatasetReviewRejectBodySchema })
    .strict(),
  z
    .object({ ...identity, kind: z.literal('PRICE_CHANGES'), body: DatasetReviewChangesBodySchema })
    .strict(),
  z
    .object({ ...identity, kind: z.literal('ASSESS'), body: DatasetContentAssessmentBodySchema })
    .strict(),
]);
export type DatasetReviewCommand = z.infer<typeof DatasetReviewCommandSchema>;
const key = (datasetId: string, actorId: string) =>
  `kuinbee:dataset-admin-request:v1:${id.parse(actorId)}:${id.parse(datasetId)}`;
const serialize = (command: DatasetReviewCommand) =>
  JSON.stringify(DatasetReviewCommandSchema.parse(command));
// Two 4,000-character feedback fields can exceed 16 KiB in UTF-8. Keep the
// command bounded without rejecting valid non-ASCII contract values.
const maximumBytes = 65_536;

// One bounded unresolved command for this Dataset, administrator and browser
// tab. No file bytes, signed URLs, auth credentials or inspection facts persist.
export function readDatasetReviewCommand(
  datasetId: string,
  actorId: string
): DatasetReviewCommand | null {
  const value = sessionStorage.getItem(key(datasetId, actorId));
  if (value === null) return null;
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw new Error('Stored review request exceeds its limit.');
  const command = DatasetReviewCommandSchema.parse(JSON.parse(value));
  if (command.datasetId !== datasetId || command.actorId !== actorId)
    throw new Error('Stored review request belongs to another context.');
  return command;
}
export function storeDatasetReviewCommand(supplied: DatasetReviewCommand) {
  const command = DatasetReviewCommandSchema.parse(supplied),
    value = serialize(command);
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw new Error('Review request exceeds its limit.');
  const previous = readDatasetReviewCommand(command.datasetId, command.actorId);
  if (previous && serialize(previous) !== value)
    throw new Error('Confirm the previous review request first.');
  sessionStorage.setItem(key(command.datasetId, command.actorId), value);
  if (sessionStorage.getItem(key(command.datasetId, command.actorId)) !== value)
    throw new Error('Review request could not be retained.');
}
export function clearDatasetReviewCommand(command: DatasetReviewCommand) {
  const previous = readDatasetReviewCommand(command.datasetId, command.actorId);
  if (previous && serialize(previous) !== serialize(command))
    throw new Error('Stored review request changed.');
  sessionStorage.removeItem(key(command.datasetId, command.actorId));
  if (sessionStorage.getItem(key(command.datasetId, command.actorId)) !== null)
    throw new Error('Review request could not be cleared.');
}

// Only these supported domain rejections follow the owned durable-receipt lookup.
// Auth, route/validator/rate-limit failures cannot disprove an earlier lost ACK.
const definiteRejections = new Set([
  'DRAFT_CHANGED',
  'PRICING_CHANGED',
  'REVIEW_CHANGED',
  'INVALID_STATE',
  'INVALID_EDIT_CONTEXT',
  'IDEMPOTENCY_CONFLICT',
  'CONTENT_CAPACITY_EXCEEDED',
  'ALREADY_ASSIGNED',
  'NOT_ASSIGNED',
  'WORKFLOW_NOT_QUALIFIED',
  'STORAGE_LIMIT_EXCEEDED',
  'DEPENDENCIES_CHANGED',
  'PRICING_NOT_READY',
  'PRICING_APPROVAL_REQUIRED',
  'OBJECT_NOT_ACCEPTED',
  'INSPECTION_NOT_QUALIFIED',
  'COMPONENT_NOT_ACCEPTED',
  'INCOMPLETE_INSPECTION_EVIDENCE',
]);
export function ambiguousDatasetReviewFailure(error: unknown) {
  return !(
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    error.statusCode === 409 &&
    'code' in error &&
    typeof error.code === 'string' &&
    definiteRejections.has(error.code)
  );
}
export function dispatchDatasetReviewCommand(
  supplied: DatasetReviewCommand,
  actorId: string,
  signal?: AbortSignal
) {
  const command = DatasetReviewCommandSchema.parse(supplied);
  if (command.actorId !== actorId) throw new Error('The signed-in administrator changed.');
  const stored = readDatasetReviewCommand(command.datasetId, actorId);
  if (!stored || serialize(stored) !== serialize(command))
    throw new Error('Retain the exact review request before dispatching it.');
  switch (command.kind) {
    case 'PICK':
    case 'APPROVE':
    case 'REJECT':
    case 'CHANGES':
      return datasetContentApi.decision(command.datasetId, command.kind, command.body, signal);
    case 'PRICE_APPROVE':
      return datasetContentApi.pricingDecision(command.datasetId, 'APPROVE', command.body, signal);
    case 'PRICE_REJECT':
      return datasetContentApi.pricingDecision(command.datasetId, 'REJECT', command.body, signal);
    case 'PRICE_CHANGES':
      return datasetContentApi.pricingDecision(command.datasetId, 'CHANGES', command.body, signal);
    case 'ASSESS':
      return datasetContentApi.assess(command.datasetId, command.body, signal);
  }
}
