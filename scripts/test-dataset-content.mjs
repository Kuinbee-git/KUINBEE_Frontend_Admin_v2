import assert from 'node:assert/strict';
import { tableMetadataFixture } from './table-metadata-fixtures.mjs';
import { after, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import {
  id,
  actorId,
  otherActorId,
  seed,
  review,
  assessment,
  inventory,
  now,
  attachPublished,
  publishedReview,
} from './dataset-content-fixtures.mjs';

const directory = await mkdtemp(join(tmpdir(), 'kuinbee-admin-content-protocol-'));
const originalFetch = globalThis.fetch,
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage);
  else delete globalThis.sessionStorage;
  await rm(directory, { recursive: true, force: true });
});
async function load(environment) {
  const output = join(directory, environment + '.mjs');
  await build({
    stdin: {
      contents:
        "export * from './src/services/dataset-content.service';export * from './src/lib/datasets/dataset-review-commands';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    outfile: output,
    platform: 'node',
    format: 'esm',
    define: {
      'process.env.NEXT_PUBLIC_APP_ENV': JSON.stringify(environment),
      'process.env.NODE_ENV': '"test"',
    },
  });
  return import(pathToFileURL(output).href);
}
const mod = await load('local'),
  production = await load('production'),
  api = mod.datasetContentApi;
const model = seed(),
  requests = [];
const matches = (code) => (error) => error.code === code;
let answer;
globalThis.fetch = async (url, options) => {
  requests.push({
    url: new URL(url),
    ...options,
    body: options.body ? JSON.parse(options.body) : null,
  });
  return new Response(JSON.stringify({ success: true, data: answer }), {
    headers: { 'content-type': 'application/json' },
  });
};
const context = () => ({
  requestId: '27b2ac94-39f2-4b3d-8aa3-291324f3f7f1',
  expectedWorkflowRevision: model.state.workflowRevision,
  expectedReviewedContentId: model.submittedContent.id,
  expectedPricingReference: { id: model.state.pricing.id, revision: model.state.pricing.revision },
});
const clone = (value) => structuredClone(value);
test('production gate performs no canonical request', async () => {
  const before = requests.length;
  await assert.rejects(
    production.datasetContentApi.review(model.state.datasetId),
    matches('NOT_ENABLED')
  );
  assert.equal(requests.length, before);
});
test('all three upload choices keep exact frozen fields and current feedback without fabricated tabular facts', async () => {
  for (const choice of ['SAMPLE_ONLY', 'FULL_ONLY', 'FULL_AND_SAMPLE']) {
    const value = seed(choice);
    value.reviewFeedback.notes = 'Current correction notes';
    answer = review(value);
    const result = await api.review(value.state.datasetId);
    assert.equal(result.submittedContent.uploadChoice, choice);
    assert.equal(result.reviewFeedback.notes, 'Current correction notes');
    assert.equal(result.submittedContent.common.rows, undefined);
    const request = requests.at(-1);
    assert.equal(request.cache, 'no-store');
    assert.equal(request.credentials, 'include');
    assert.equal(
      request.url.pathname,
      `/api/v2/admin/dataset-proposals/${value.state.datasetId}/review`
    );
  }
});
test('review refuses extra fields, another Dataset and a mutable reviewed pointer', async () => {
  for (const mutate of [
    (value) => {
      value.extra = true;
    },
    (value) => {
      value.state.datasetId = id(999);
    },
    (value) => {
      value.state.reviewedContentId = id(998);
    },
  ]) {
    answer = review(model);
    mutate(answer);
    await assert.rejects(
      api.review(model.state.datasetId),
      matches('INCOMPATIBLE_DATASET_RESPONSE')
    );
  }
});
test('assessment read accepts reduced pricing but rejects another selected content', async () => {
  answer = assessment(model);
  assert.equal(
    (await api.assessment(model.state.datasetId, 'REVIEWED')).state.pricing.notes,
    undefined
  );
  answer.target = 'PUBLISHED';
  await assert.rejects(
    api.assessment(model.state.datasetId, 'REVIEWED'),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
});
test('mixed admin queue sends its server filter and verifies global paging', async () => {
  answer = { items: [], total: 80, page: 2, pageSize: 20 };
  await api.inbox({ page: 2, pageSize: 20, reviewQueue: 'UPDATES' });
  assert.equal(requests.at(-1).url.searchParams.get('reviewQueue'), 'UPDATES');
  answer.page = 1;
  await assert.rejects(
    api.inbox({ page: 2, pageSize: 20 }),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
});
test('frozen pagination keeps exact workflow, content and inventory; never returns a replacement manifest', async () => {
  const m = seed('FULL_ONLY', 21),
    query = {
      expectedWorkflowRevision: m.state.workflowRevision,
      contentId: m.submittedContent.id,
      contentGeneration: 1,
      inventory: 'FILES',
      limit: 20,
    };
  answer = inventory(m, query);
  const result = await api.frozenInventory(m.state.datasetId, query);
  assert.equal(result.items.length, 20);
  answer.nextCursor.inventory = 'GROUPS';
  await assert.rejects(
    api.frozenInventory(m.state.datasetId, query),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
});
test('dataset receipt verifies UUID, exact refs, revision and terminal state', async () => {
  const body = { ...context(), notes: 'Reviewed' };
  const valid = {
    requestId: body.requestId,
    state: {
      ...clone(model.state),
      workflowRevision: body.expectedWorkflowRevision + 1,
      datasetStatus: 'VERIFIED',
      verificationStatus: 'VERIFIED',
    },
  };
  answer = valid;
  await api.decision(model.state.datasetId, 'APPROVE', body);
  for (const mutate of [
    (value) => {
      value.requestId = '27b2ac94-39f2-4b3d-8aa3-291324f3f7f2';
    },
    (value) => {
      value.state.pricing.revision++;
    },
    (value) => {
      value.state.reviewedContentId = id(900);
    },
    (value) => {
      value.state.datasetStatus = 'PUBLISHED';
    },
  ]) {
    answer = clone(valid);
    mutate(answer);
    await assert.rejects(
      api.decision(model.state.datasetId, 'APPROVE', body),
      matches('INCOMPATIBLE_DATASET_RESPONSE')
    );
  }
});
test('pricing acknowledgment increments its own revision and can retain an independent editable content', async () => {
  const body = { ...context(), notes: 'Reviewed pricing' };
  answer = {
    requestId: body.requestId,
    state: {
      ...clone(model.state),
      activeContentId: id(800),
      workflowRevision: body.expectedWorkflowRevision + 1,
      pricing: {
        ...model.state.pricing,
        revision: model.state.pricing.revision + 1,
        status: 'ACTIVE',
      },
    },
  };
  await api.pricingDecision(model.state.datasetId, 'APPROVE', body);
  assert(requests.at(-1).url.pathname.endsWith('/pricing/approve'));
  answer.state.pricing.revision--;
  await assert.rejects(
    api.pricingDecision(model.state.datasetId, 'APPROVE', body),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
});
test('admin file access cannot ask for working, granted or unpinned files', async () => {
  const before = requests.length;
  for (const scope of ['WORKING', 'GRANTED', 'EDIT_BASE'])
    await assert.rejects(
      api.fileContext(model.state.datasetId, { scope, component: 'FULL' }),
      matches('INVALID_FILE_SCOPE')
    );
  await assert.rejects(
    api.files(model.state.datasetId, {
      scope: 'REVIEWED',
      component: 'FULL',
      contentId: model.submittedContent.id,
      contentGeneration: 1,
      limit: 20,
    }),
    matches('INVALID_FILE_SCOPE')
  );
  assert.equal(requests.length, before);
});
test('download is a fresh explicit POST with current exact context and sixty second attachment', async () => {
  const member = model.members[0],
    selection = {
      scope: 'REVIEWED',
      component: member.component,
      contentId: model.submittedContent.id,
      contentGeneration: 1,
      expectedWorkflowRevision: model.state.workflowRevision,
    };
  const body = { ...selection, memberId: member.id, downloadIntentId: context().requestId };
  answer = {
    context: {
      ...selection,
      datasetId: model.state.datasetId,
      workflowRevision: selection.expectedWorkflowRevision,
      editOperation: null,
      frozen: true,
      publicationId: null,
    },
    memberId: member.id,
    downloadIntentId: body.downloadIntentId,
    fileName: 'test.wav',
    measuredSizeBytes: '48044',
    url: 'https://storage.example.test/file',
    expiresAt: now,
    expiresInSeconds: 60,
    disposition: 'ATTACHMENT',
  };
  delete answer.context.expectedWorkflowRevision;
  await api.download(model.state.datasetId, body);
  assert.equal(requests.at(-1).method, 'POST');
  answer.context.contentGeneration = 2;
  await assert.rejects(
    api.download(model.state.datasetId, body),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
});
test('unknown file evidence and archive entries cannot become download entitlements', async () => {
  const before = requests.length;
  await assert.rejects(
    api.download(model.state.datasetId, {
      scope: 'REVIEWED',
      component: 'FULL',
      contentId: model.submittedContent.id,
      contentGeneration: 1,
      expectedWorkflowRevision: 1,
      memberId: model.members[0].id,
      downloadIntentId: context().requestId,
      logicalEntryId: id(400),
    })
  );
  assert.equal(requests.length, before);
});
const values = new Map();
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  },
});
test('unconfirmed command survives reload, isolates actors and refuses another payload or UUID', () => {
  const command = { actorId, datasetId: model.state.datasetId, kind: 'PICK', body: context() };
  mod.storeDatasetReviewCommand(command);
  assert.deepEqual(mod.readDatasetReviewCommand(command.datasetId, actorId), command);
  assert.equal(mod.readDatasetReviewCommand(command.datasetId, otherActorId), null);
  assert.throws(() =>
    mod.storeDatasetReviewCommand({
      ...command,
      body: { ...command.body, expectedWorkflowRevision: 20 },
    })
  );
  assert.throws(() =>
    mod.clearDatasetReviewCommand({
      ...command,
      body: { ...command.body, expectedWorkflowRevision: 20 },
    })
  );
  assert.throws(() => mod.dispatchDatasetReviewCommand(command, otherActorId));
  mod.clearDatasetReviewCommand(command);
  assert.equal(mod.readDatasetReviewCommand(command.datasetId, actorId), null);
});
test('pre-lookup failures retain uncertainty; only known post-lookup conflicts settle a rejected command', () => {
  for (const statusCode of [0, 400, 401, 403, 404, 429, 500, 502, 503])
    assert.equal(mod.ambiguousDatasetReviewFailure({ statusCode, code: 'DRAFT_CHANGED' }), true);
  assert.equal(
    mod.ambiguousDatasetReviewFailure({ statusCode: 409, code: 'DRAFT_CHANGED' }),
    false
  );
  assert.equal(mod.ambiguousDatasetReviewFailure({ statusCode: 409, code: 'UNKNOWN' }), true);
});
test('maximum non-ASCII feedback fits the bounded exact request without truncation', () => {
  const notes = '字'.repeat(4000),
    command = {
      actorId,
      datasetId: model.state.datasetId,
      kind: 'REJECT',
      body: { ...context(), notes, rejectionReason: notes },
    };
  mod.storeDatasetReviewCommand(command);
  assert.equal(
    mod.readDatasetReviewCommand(command.datasetId, actorId).body.rejectionReason,
    notes
  );
  mod.clearDatasetReviewCommand(command);
});
test('mismatched assessment receipt cannot establish a score for another content or scope', async () => {
  const body = {
    requestId: context().requestId,
    expectedWorkflowRevision: 1,
    expectedContentId: model.submittedContent.id,
    target: 'REVIEWED',
    Q: 80,
    L: 80,
    P: 80,
    U: 80,
    F: 80,
  };
  const record = {
    id: id(600),
    datasetId: model.state.datasetId,
    contentId: model.submittedContent.id,
    Q: 80,
    L: 80,
    P: 80,
    U: 80,
    F: 80,
    finalScore: '80.00',
    adminId: actorId,
    createdAt: now,
    note: null,
    scope: {
      uploadedComponents: ['FULL', 'SAMPLE'],
      representedCollection: 'SUPPLIER_DECLARATION',
    },
  };
  const publicRecord = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'note'));
  const valid = {
    requestId: body.requestId,
    state: { ...assessment(model).state, workflowRevision: 2 },
    visibility: 'PRIVATE',
    publication: null,
    reviewedAssessment: publicRecord,
    publishedAssessment: null,
    assessmentChange: { target: 'REVIEWED', assessment: record },
  };
  answer = valid;
  await api.assess(model.state.datasetId, body);
  for (const mutate of [
    (value) => {
      value.assessmentChange.target = 'PUBLISHED';
    },
    (value) => {
      value.assessmentChange.assessment.contentId = id(999);
    },
    (value) => {
      value.assessmentChange.assessment.L = 0;
    },
  ]) {
    answer = clone(valid);
    mutate(answer);
    await assert.rejects(
      api.assess(model.state.datasetId, body),
      matches('INCOMPATIBLE_DATASET_RESPONSE')
    );
  }
});

test('private published view and inventory preserve published A independently of reviewed B and reject pointer substitution', async () => {
  const value = attachPublished(seed());
  answer = publishedReview(value);
  const selected = await api.publishedReview(value.state.datasetId);
  assert.notEqual(selected.state.reviewedContentId, selected.publishedContent.id);
  assert.equal(selected.publishedContent.common.license, 'CC-BY-4.0');
  assert(requests.at(-1).url.pathname.endsWith('/published'));
  const query = {
    expectedWorkflowRevision: value.state.workflowRevision,
    contentId: selected.publishedContent.id,
    contentGeneration: selected.publishedContent.generation,
    inventory: 'FILES',
    limit: 20,
  };
  answer = inventory(
    { ...value, submittedContent: value.published.content, members: value.published.members },
    query
  );
  await api.frozenInventory(value.state.datasetId, query, undefined, 'PUBLISHED');
  assert(requests.at(-1).url.pathname.endsWith('/published/inventory'));
  answer = publishedReview(value);
  answer.state.publishedContentId = value.state.reviewedContentId;
  await assert.rejects(
    api.publishedReview(value.state.datasetId),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
  answer = publishedReview(value);
  answer.publication = null;
  await assert.rejects(
    api.publishedReview(value.state.datasetId),
    matches('INCOMPATIBLE_DATASET_RESPONSE')
  );
});

test('review table metadata stays private and bound to the exact submitted context', async () => {
  const context = {
    datasetId: model.state.datasetId,
    scope: 'REVIEWED',
    component: 'FULL',
    contentId: model.submittedContent.id,
    contentGeneration: model.submittedContent.generation,
    workflowRevision: model.state.workflowRevision,
    frozen: true,
    publicationId: null,
    editOperation: null,
  };
  const value = tableMetadataFixture(context),
    query = {
      scope: context.scope,
      component: context.component,
      contentId: context.contentId,
      contentGeneration: context.contentGeneration,
      expectedWorkflowRevision: context.workflowRevision,
      memberId: value.memberId,
      limit: 20,
    };
  answer = value;
  assert.deepEqual(await api.tableMetadata(context.datasetId, query), value);
  assert(requests.at(-1).url.pathname.endsWith('/dataset-files/' + context.datasetId + '/tables'));
  assert.equal(requests.at(-1).credentials, 'include');
  assert.equal(requests.at(-1).cache, 'no-store');
  for (const mutate of [
    (v) => v.context.workflowRevision++,
    (v) => v.page.contentGeneration++,
    (v) => (v.memberId = id(999)),
    (v) => (v.targets[0].id = id(999)),
    (v) => (v.page.items[0].missingValues.value = 'inactive private claim'),
    (v) => (v.page.items[0].storageKey = 'secret'),
  ]) {
    answer = structuredClone(value);
    mutate(answer);
    await assert.rejects(
      api.tableMetadata(context.datasetId, query),
      matches('INCOMPATIBLE_DATASET_RESPONSE')
    );
  }
});
test('admin table readers reject supplier edit bases, grants and missing review revisions without requests', async () => {
  const before = requests.length,
    query = {
      scope: 'REVIEWED',
      component: 'FULL',
      contentId: model.submittedContent.id,
      contentGeneration: 1,
      limit: 20,
    };
  for (const scope of ['WORKING', 'EDIT_BASE', 'GRANTED'])
    await assert.rejects(
      api.tableMetadata(model.state.datasetId, { ...query, scope }),
      matches('INVALID_FILE_SCOPE')
    );
  await assert.rejects(
    api.tableMetadata(model.state.datasetId, query),
    matches('INVALID_FILE_SCOPE')
  );
  await assert.rejects(
    production.datasetContentApi.tableMetadata(model.state.datasetId, {
      ...query,
      expectedWorkflowRevision: 1,
    }),
    matches('NOT_ENABLED')
  );
  assert.equal(requests.length, before);
});
