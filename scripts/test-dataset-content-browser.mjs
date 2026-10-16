import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import {
  DatasetReviewPickBodySchema,
  DatasetReviewApproveBodySchema,
  DatasetReviewRejectBodySchema,
  DatasetReviewChangesBodySchema,
  DatasetContentAssessmentBodySchema,
  DatasetWorkflowResponseSchema,
  DatasetPublicationResponseSchema,
  DatasetFrozenInventoryQuerySchema,
  DatasetAdminProposalsQuerySchema,
  DatasetAdminProposalsResponseSchema,
  DatasetFileDownloadBodySchema,
  DatasetFileDownloadResponseSchema,
  DatasetFileObservationQuerySchema,
  DatasetFileObservationResponseSchema,
} from '@kuinbee/dataset-preparation-contracts';
import {
  actorId,
  otherActorId,
  id,
  now,
  seed,
  review,
  assessment,
  inventory,
  attachPublished,
  publishedReview,
} from './dataset-content-fixtures.mjs';

// Actual React review boundary, queue, forms, command storage, HTTP and native
// browser events; explicit synthetic API. Not scanner/provider/hosted proof.
const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve('postcss', { paths: [require.resolve('@tailwindcss/postcss')] })
);
const css = (
  await postcss([require('@tailwindcss/postcss')({ base: process.cwd() })]).process(
    await readFile('src/app/globals.css', 'utf8'),
    { from: resolve('src/app/globals.css') }
  )
).css;
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{ContentReviewBoundary}from'./src/components/datasets/content/ContentReviewBoundary';import{ProposalsView}from'./src/components/proposals/ProposalsView';import{UpdateRequestsView}from'./src/components/update-requests/UpdateRequestsView';import AdminQuestionsPage from './src/app/dashboard/questions/page';import{useAuthStore}from'./src/store/auth.store';const root=createRoot(document.getElementById('root'));let sequence=0;window.mount=(id,mode='review',actor=${JSON.stringify(actorId)},type='SUPERADMIN')=>{useAuthStore.getState().setUser({id:actor,email:'review@example.test',userType:type,status:'ACTIVE',emailVerified:true});const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});root.render(<React.StrictMode><QueryClientProvider client={client} key={++sequence}>{mode==='questions'?<AdminQuestionsPage/>:mode==='updates'?<UpdateRequestsView/>:mode==='queue'?<ProposalsView/>:<ContentReviewBoundary datasetId={id} queueType='proposals' legacy={<p data-legacy-review>Existing legacy review route</p>}/>}</QueryClientProvider></React.StrictMode>)};window.switchActor=(id)=>useAuthStore.getState().setUser({id,email:'other@example.test',userType:'ADMIN',status:'ACTIVE',emailVerified:true});window.mount(location.pathname.split('/').at(-1));`,
    loader: 'jsx',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  define: {
    'process.env': JSON.stringify({
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_ENV: 'local',
      NEXT_PUBLIC_API_URL: '/api',
      NEXT_PUBLIC_API_TIMEOUT_MS: '20000',
      NEXT_PUBLIC_UPLOAD_TIMEOUT_MS: '600000',
    }),
  },
  plugins: [
    {
      name: 'fixture-navigation',
      setup(builder) {
        builder.onResolve({ filter: /^next\/navigation$/ }, (args) => ({
          path: args.path,
          namespace: 'fixture',
        }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          resolveDir: process.cwd(),
          contents:
            "import {useSyncExternalStore} from 'react';const subscribe=callback=>{window.addEventListener('popstate',callback);return()=>window.removeEventListener('popstate',callback)};const read=()=>location.pathname+location.search;function navigate(path){window.navigations.push(path);history.replaceState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'))}export function useRouter(){return{push:navigate,replace:navigate}}export function useSearchParams(){useSyncExternalStore(subscribe,read);return new URLSearchParams(location.search)}export function usePathname(){useSyncExternalStore(subscribe,read);return location.pathname}",
        }));
      },
    },
  ],
});
const questionFixtures = new Map();
let questionInventoryRows = [];
const models = new Map(),
  receipts = new Map(),
  requests = [],
  errors = [],
  browserErrors = [];
const flags = { lose: null, deny: null, failRefresh: false, security: false, mismatch: false };
let permissionList = [];
const add = (choice, count) => {
  const m = seed(choice, count);
  models.set(m.state.datasetId, m);
  return m;
};
const ok = (res, data) => {
  res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'private, no-store' });
  res.end(JSON.stringify({ success: true, data }));
};
const deny = (res, code, status = 409) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(
    JSON.stringify({ success: false, error: { code, message: code + ': fixture response' } })
  );
};
const queryObject = (url) => Object.fromEntries(url.searchParams);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://fixture.test');
    if (url.pathname === '/bundle.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(bundle.outputFiles[0].contents);
      return;
    }
    if (url.pathname === '/style.css') {
      res.writeHead(200, { 'content-type': 'text/css' });
      res.end(css);
      return;
    }
    if (!url.pathname.startsWith('/api/')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:var(--bg-surface);padding:20px"><main id="root"></main><script>window.navigations=[]</script><script src="/bundle.js"></script></body></html>'
      );
      return;
    }
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      assert(Buffer.byteLength(raw) <= 32768);
    }
    const body = raw ? JSON.parse(raw) : null;
    requests.push({ path: url.pathname, method: req.method, body, query: queryObject(url) });
    if (url.pathname.endsWith('/permissions/me')) return ok(res, { permissions: permissionList });
    if (/permissions/.test(url.pathname)) return ok(res, { permissions: permissionList });
    if (url.pathname === '/api/v1/marketplace/questions/datasets')
      return ok(res, {
        items: questionInventoryRows,
        page: 1,
        pageSize: 10,
        total: questionInventoryRows.length,
      });
    const questionList = url.pathname.match(
      /^\/api\/v1\/marketplace\/datasets\/([^/]+)\/questions$/
    );
    if (questionList) {
      const items = questionFixtures.get(questionList[1]) ?? [];
      return ok(res, { items, page: 1, pageSize: 20, total: items.length });
    }
    const questionAction = url.pathname.match(
      /^\/api\/v1\/marketplace\/questions\/([^/]+)(\/answers)?$/
    );
    if (questionAction) {
      const entry = [...questionFixtures.entries()].find(([, items]) =>
        items.some((item) => item.id === questionAction[1])
      );
      assert(entry);
      const selected = entry[1].find((item) => item.id === questionAction[1]);
      if (req.method === 'POST') {
        assert(body.answer.length > 0 && body.answer.length <= 5000);
        selected.answers.push({ id: id(99104), answer: body.answer, createdAt: now });
      } else {
        assert.equal(req.method, 'DELETE');
        assert(body.reason.length >= 3);
        questionFixtures.set(
          entry[0],
          entry[1].filter((item) => item.id !== selected.id)
        );
      }
      return ok(res, { success: true });
    }
    if (url.pathname === '/api/v2/admin/dataset-proposals') {
      const query = DatasetAdminProposalsQuerySchema.parse(queryObject(url));
      const rows = [...models.values()].map((m, index) => ({
        id: m.state.datasetId,
        datasetUniqueId: m.state.datasetUniqueId,
        title: m.submittedContent.common.title,
        status: m.state.datasetStatus,
        verificationStatus: m.state.verificationStatus,
        primaryCategory: { id: 'category', name: 'Current category label' },
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
        material:
          index === 0
            ? { representation: 'LEGACY', currentUploadId: null }
            : {
                representation: 'CONTENT',
                activeContentId: null,
                reviewedContentId: m.submittedContent.id,
                publishedContentId: null,
                uploadChoice: m.submittedContent.uploadChoice,
                workflowRevision: m.state.workflowRevision,
              },
        managementContext: index === 0 ? null : 'INITIAL_PROPOSAL',
        supplier: { id: id(9), email: 'supplier@example.test' },
        activeAssignment: null,
      }));
      return ok(
        res,
        DatasetAdminProposalsResponseSchema.parse({
          page: query.page,
          pageSize: query.pageSize,
          total: rows.length,
          items: rows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
        })
      );
    }
    const parts = url.pathname.match(
      /^\/api\/v2\/admin\/(dataset-proposals|dataset-files)\/([^/]+)\/(.+)$/
    );
    if (!parts) throw new Error('Unexpected API ' + url.pathname);
    const [, namespace, datasetId, tail] = parts,
      m = models.get(datasetId);
    if (!m) return deny(res, 'NOT_FOUND', 404);
    if (req.method === 'GET' && tail === 'review') {
      if (flags.failRefresh) return deny(res, 'SERVER_ERROR', 503);
      if (m.readFailure) return deny(res, m.readFailure.code, m.readFailure.status);
      const data = review(m);
      if (flags.mismatch) data.state.reviewedContentId = id(99999);
      return ok(res, data);
    }
    if (req.method === 'GET' && tail === 'assessment')
      return ok(res, assessment(m, url.searchParams.get('target') ?? 'REVIEWED'));
    if (req.method === 'GET' && tail === 'published') return ok(res, publishedReview(m));
    if (
      namespace === 'dataset-proposals' &&
      (tail === 'inventory' || tail === 'published/inventory')
    ) {
      const query = DatasetFrozenInventoryQuerySchema.parse(queryObject(url));
      assert.equal(query.expectedWorkflowRevision, m.state.workflowRevision);
      const selected =
        tail === 'published/inventory'
          ? { ...m, submittedContent: m.published.content, members: m.published.members }
          : m;
      assert.equal(query.contentId, selected.submittedContent.id);
      return ok(res, inventory(selected, query));
    }
    if (namespace === 'dataset-files') {
      const input =
        tail === 'download-url'
          ? DatasetFileDownloadBodySchema.parse(body)
          : DatasetFileObservationQuerySchema.parse(queryObject(url));
      assert(['REVIEWED', 'PUBLISHED'].includes(input.scope));
      const selected =
        input.scope === 'PUBLISHED'
          ? m.published
          : { content: m.submittedContent, members: m.members };
      assert.equal(input.contentId, selected.content.id);
      assert.equal(input.contentGeneration, selected.content.generation);
      assert.equal(input.expectedWorkflowRevision, m.state.workflowRevision);
      const member = selected.members.find((item) => item.id === input.memberId);
      assert(member);
      assert.equal(input.component, member.component);
      if (flags.security) return deny(res, 'OBJECT_NOT_ACCEPTED');
      const context = {
        datasetId,
        scope: input.scope,
        component: input.component,
        contentId: input.contentId,
        contentGeneration: input.contentGeneration,
        workflowRevision: m.state.workflowRevision,
        editOperation: null,
        frozen: true,
        publicationId: input.scope === 'PUBLISHED' ? selected.publication.id : null,
      };
      if (tail === 'download-url')
        return ok(
          res,
          DatasetFileDownloadResponseSchema.parse({
            context,
            memberId: member.id,
            downloadIntentId: input.downloadIntentId,
            fileName: member.originalFileName,
            measuredSizeBytes: member.measuredSizeBytes,
            url: 'https://private-storage.example.test/file?intent=' + input.downloadIntentId,
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            expiresInSeconds: 60,
            disposition: 'ATTACHMENT',
          })
        );
      return ok(
        res,
        DatasetFileObservationResponseSchema.parse({
          context,
          memberId: member.id,
          evidenceId: input.evidenceId,
          evidenceRelationship: 'CURRENT_AND_CAPTURED',
          total: 1,
          items: [
            {
              id: id(9000),
              evidenceId: input.evidenceId,
              profileId: 'WAV_PCM',
              result: 'COMPLETE',
              source: { kind: 'PHYSICAL_OBJECT', uploadObjectId: member.uploadObjectId },
              measuredSizeBytes: member.measuredSizeBytes,
              checksumSha256: 'b'.repeat(64),
              origin: 'BACKEND_OBSERVED',
              scope: 'EXACT_UPLOADED_OBJECT',
              facts: { codec: 'PCM', sampleRateHz: 48000 },
            },
          ],
          nextCursor: null,
        })
      );
    }
    const receiptKey = datasetId + ':' + body.requestId;
    if (flags.deny) return deny(res, flags.deny.code, flags.deny.status);
    if (receipts.has(receiptKey)) return ok(res, receipts.get(receiptKey));
    if (body.expectedWorkflowRevision !== m.state.workflowRevision)
      return deny(res, 'DRAFT_CHANGED');
    if (tail === 'assessment') {
      const parsed = DatasetContentAssessmentBodySchema.parse(body);
      const selected =
        parsed.target === 'PUBLISHED'
          ? m.published
          : { content: m.submittedContent, members: m.members };
      assert.equal(parsed.expectedContentId, selected.content.id);
      m.state.workflowRevision++;
      const rating = {
        id: id(9100),
        datasetId,
        contentId: selected.content.id,
        Q: parsed.Q,
        L: parsed.L,
        P: parsed.P,
        U: parsed.U,
        F: parsed.F,
        finalScore: '80.00',
        adminId: actorId,
        createdAt: now,
        note: parsed.note ?? null,
        scope: {
          uploadedComponents: [...new Set(selected.members.map((item) => item.component))],
          representedCollection: 'SUPPLIER_DECLARATION',
        },
      };
      if (parsed.target === 'PUBLISHED') {
        m.published.assessment = rating;
        m.published.publication.currentAssessmentId = rating.id;
        if (parsed.L < 60) m.state.publishedContentId = null;
      } else m.assessment = rating;
      const summary = (value) =>
        value ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'note')) : null;
      const value = DatasetPublicationResponseSchema.parse({
        state: assessment(m).state,
        requestId: parsed.requestId,
        visibility: 'PRIVATE',
        publication: m.state.publishedContentId ? m.published.publication : null,
        reviewedAssessment: summary(m.assessment),
        publishedAssessment: m.state.publishedContentId ? summary(m.published.assessment) : null,
        assessmentChange: { target: parsed.target, assessment: rating },
      });
      receipts.set(receiptKey, value);
      if (flags.lose === tail) return deny(res, 'SUCCESS_ACK_UNAVAILABLE', 503);
      return ok(res, value);
    }
    const action = tail.split('/').at(-1),
      isPrice = tail.startsWith('pricing/');
    const schema =
      action === 'pick'
        ? DatasetReviewPickBodySchema
        : action === 'approve'
          ? DatasetReviewApproveBodySchema
          : action === 'reject'
            ? DatasetReviewRejectBodySchema
            : DatasetReviewChangesBodySchema;
    schema.parse(body);
    assert.equal(body.expectedReviewedContentId, m.submittedContent.id);
    assert.equal(body.expectedPricingReference.id, m.state.pricing.id);
    assert.equal(body.expectedPricingReference.revision, m.state.pricing.revision);
    if (action === 'pick') {
      m.state.datasetStatus = 'UNDER_REVIEW';
      m.state.verificationStatus = 'UNDER_REVIEW';
      m.assignment = { id: id(9200), adminId: actorId, status: 'ACTIVE', assignedAt: now };
    } else if (isPrice) {
      m.state.pricing.revision++;
      m.state.pricing.status =
        action === 'approve' ? 'ACTIVE' : action === 'reject' ? 'REJECTED' : 'CHANGES_REQUESTED';
      m.state.pricing.notes = body.notes ?? null;
    } else {
      assert.equal(m.assignment?.adminId, actorId);
      m.state.verificationStatus =
        action === 'approve' ? 'VERIFIED' : action === 'reject' ? 'REJECTED' : 'CHANGES_REQUESTED';
      m.state.datasetStatus =
        action === 'approve' ? 'VERIFIED' : action === 'reject' ? 'REJECTED' : 'SUBMITTED';
      m.reviewFeedback.notes = body.notes ?? null;
      if (action !== 'request-changes') m.assignment = null;
    }
    m.state.workflowRevision++;
    const value = DatasetWorkflowResponseSchema.parse({
      requestId: body.requestId,
      state: m.state,
    });
    receipts.set(receiptKey, structuredClone(value));
    if (flags.lose === tail) return deny(res, 'SUCCESS_ACK_UNAVAILABLE', 503);
    if (m.failAfterNext) flags.failRefresh = true;
    return ok(res, value);
  } catch (error) {
    errors.push(error.stack);
    deny(res, 'FIXTURE_ERROR', 500);
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const artifacts =
  process.env.DATASET_ADMIN_ARTIFACTS ?? '/tmp/kuinbee-admin-content-browser-20261016';
await mkdir(artifacts, { recursive: true });
let browser, page;
const button = (page, name) => page.getByRole('button', { name, exact: true });
const enabled = async (locator) => {
  await locator.waitFor();
  await assertEventually(() => locator.isEnabled());
};
async function assertEventually(check) {
  const until = Date.now() + 15000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail('Condition did not become true');
}
async function open(page, model) {
  await page.goto(origin + '/review/' + model.state.datasetId, { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('heading', { name: model.submittedContent.common.title, exact: true })
    .waitFor();
  await enabled(button(page, 'Pick for review'));
}
async function decide(page, target, action, note) {
  await button(page, `${action} ${target}`).click();
  await page.getByLabel(target + ' decision feedback', { exact: true }).fill(note);
  await button(page, 'Confirm ' + action.toLowerCase() + ' ' + target).click();
}
try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => browserErrors.push(error.message));
  const downloadUrls = [];
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname !== 'private-storage.example.test') {
      errors.push('Unexpected external request: ' + url.origin + url.pathname);
      return route.abort();
    }
    downloadUrls.push(route.request().url());
    return route.fulfill({
      status: 200,
      headers: {
        'content-type': 'audio/wav',
        'content-disposition': 'attachment; filename=reviewed.wav',
      },
      body: Buffer.alloc(48),
    });
  });
  for (const choice of ['SAMPLE_ONLY', 'FULL_ONLY', 'FULL_AND_SAMPLE']) {
    const m = add(choice);
    await open(page, m);
    assert.equal(
      requests.filter((request) => request.method === 'POST').length,
      0,
      'Opening and inspecting are read-only'
    );
    await page.getByText('Scoped collection, sample and modality details', { exact: true }).click();
    await page.getByText('200', { exact: true }).waitFor();
    await button(page, 'Pick for review').click();
    await enabled(button(page, 'Approve Dataset'));
    await decide(page, 'Dataset', 'Approve', 'Reviewed exact uploaded material');
    await page.getByText('Verified', { exact: true }).first().waitFor();
    assert.equal(m.state.publishedContentId, null);
    requests.length = 0;
  }
  console.log(
    'PASS all three choices render frozen modality/scoped declarations and explicit assigned review without publication'
  );

  const paid = add('FULL_AND_SAMPLE');
  paid.state.pricing.isPaid = true;
  paid.state.pricing.price = '12.50';
  paid.state.pricing.currency = 'USD';
  await open(page, paid);
  await button(page, 'Pick for review').click();
  await enabled(button(page, 'Approve pricing'));
  assert.equal(
    await button(page, 'Approve Dataset').isEnabled(),
    false,
    'Paid Dataset requires its separate pricing approval'
  );
  await decide(page, 'pricing', 'Approve', 'Price accepted');
  await enabled(button(page, 'Approve Dataset'));
  const beforeDecision = structuredClone(paid.state);
  await decide(page, 'Dataset', 'Request changes', 'Clarify sample coverage');
  await page.getByText('Clarify sample coverage', { exact: true }).waitFor();
  const writes = requests.filter(
    (request) => request.method === 'POST' && request.path.includes(paid.state.datasetId)
  );
  assert.deepEqual(
    writes.map((request) => request.path.split('/').slice(-2).join('/')),
    [paid.state.datasetId + '/pick', 'pricing/approve', paid.state.datasetId + '/request-changes']
  );
  assert.equal(writes.at(-1).body.expectedWorkflowRevision, beforeDecision.workflowRevision);
  assert.equal(
    writes.at(-1).body.expectedPricingReference.revision,
    beforeDecision.pricing.revision
  );
  console.log(
    'PASS paid pricing is decided and freshly read before a separate exact Dataset decision; supplier feedback remains visible'
  );

  const lost = add('FULL_ONLY');
  await open(page, lost);
  flags.lose = 'pick';
  await button(page, 'Pick for review').click();
  await enabled(button(page, 'Confirm previous request'));
  assert.equal(lost.state.workflowRevision, 2);
  const originalPick = requests
    .filter((request) => request.path.endsWith(lost.state.datasetId + '/pick'))
    .at(-1).body;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await enabled(button(page, 'Confirm previous request'));
  flags.deny = { code: 'FORBIDDEN', status: 403 };
  flags.lose = null;
  await button(page, 'Confirm previous request').click();
  await enabled(button(page, 'Confirm previous request'));
  assert.equal(await button(page, 'Approve Dataset').isEnabled(), false);
  assert(
    await page.evaluate(() =>
      Object.keys(sessionStorage).some((key) => key.startsWith('kuinbee:dataset-admin-request:'))
    )
  );
  const beforeActorChange = requests.filter((request) => request.method === 'POST').length;
  await page.evaluate(({ dataset, actor }) => window.mount(dataset, 'review', actor), {
    dataset: lost.state.datasetId,
    actor: otherActorId,
  });
  await page
    .getByRole('region', { name: 'Unconfirmed review request' })
    .waitFor({ state: 'hidden' });
  await page.evaluate(({ dataset, actor }) => window.mount(dataset, 'review', actor), {
    dataset: lost.state.datasetId,
    actor: actorId,
  });
  await enabled(button(page, 'Confirm previous request'));
  assert.equal(
    requests.filter((request) => request.method === 'POST').length,
    beforeActorChange,
    'Changing actors never restores or dispatches another actor’s command'
  );
  flags.deny = null;
  await button(page, 'Confirm previous request').click();
  await enabled(button(page, 'Approve Dataset'));
  const retries = requests
    .filter((request) => request.path.endsWith(lost.state.datasetId + '/pick'))
    .map((request) => request.body);
  assert(retries.every((body) => JSON.stringify(body) === JSON.stringify(originalPick)));
  assert.equal(lost.state.workflowRevision, 2);
  console.log(
    'PASS lost ACK survives reload; authorization failures retain uncertainty; explicit replay uses the same UUID and body once'
  );

  const refreshFail = add('FULL_ONLY');
  await open(page, refreshFail);
  refreshFail.failAfterNext = true;
  await button(page, 'Pick for review').click();
  await page.getByRole('alert').filter({ hasText: 'acknowledged' }).waitFor();
  assert.equal(await button(page, 'Approve Dataset').isEnabled(), false);
  assert.equal(
    await button(page, 'Confirm previous request').count(),
    0,
    'Acknowledged receipt is cleared even when current read fails'
  );
  flags.failRefresh = false;
  refreshFail.failAfterNext = false;
  await button(page, 'Refresh current review').click();
  await enabled(button(page, 'Approve Dataset'));
  console.log(
    'PASS acknowledged write plus failed refresh keeps further decisions paused until explicit current read succeeds'
  );

  const paged = add('FULL_ONLY', 21);
  await open(page, paged);
  await page.getByRole('heading', { name: 'selected-1.wav', exact: true }).waitFor();
  await button(page, 'Next inventory page').click();
  await page.getByRole('heading', { name: 'selected-21.wav', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'selected-1.wav', exact: true }).count(), 0);
  await page.getByText('File references and checks', { exact: true }).click();
  await button(page, 'Captured format observations').click();
  await page.getByText('48000', { exact: true }).waitFor();
  flags.security = true;
  await button(page, 'Download reviewed file').click();
  await page.getByRole('alert').filter({ hasText: 'OBJECT_NOT_ACCEPTED' }).waitFor();
  assert.equal(downloadUrls.length, 0);
  flags.security = false;
  await button(page, 'Download reviewed file').click();
  await assertEventually(() => downloadUrls.length === 1);
  await button(page, 'Download reviewed file').click();
  await assertEventually(() => downloadUrls.length === 2);
  assert.notEqual(downloadUrls[0], downloadUrls[1]);
  const fileRequests = requests.filter(
    (request) =>
      request.path.includes(paged.state.datasetId) && request.path.endsWith('/download-url')
  );
  assert(
    fileRequests.every(
      (request) =>
        request.body.memberId === paged.members.at(-1).id && request.body.scope === 'REVIEWED'
    )
  );
  console.log(
    'PASS inventory pages replace their own view; exact evidence renders; security refusal signs nothing; each fresh download uses a new intent'
  );

  await button(page, 'Assess submitted material').click();
  for (const label of [
    'Quality',
    'Legal & Compliance',
    'Provenance',
    'Usability',
    'Freshness & Timeliness',
  ])
    await page.getByLabel(label + ' score', { exact: true }).fill('80');
  await page
    .getByLabel('Submitted assessment note', { exact: true })
    .fill('Exact uploaded full material');
  await button(page, 'Save submitted assessment').click();
  await page.getByText('80.00', { exact: true }).waitFor();
  assert.equal(paged.assessment.contentId, paged.submittedContent.id);
  console.log(
    'PASS assessment uses exact submitted content and explicit scores, retaining the supplier declaration scope'
  );

  for (const choice of ['SAMPLE_ONLY', 'FULL_ONLY', 'FULL_AND_SAMPLE']) {
    const model = attachPublished(add(choice));
    const exactA = model.published.content.id,
      exactB = model.submittedContent.id;
    await page.goto(origin + '/review/' + model.state.datasetId);
    await page
      .getByRole('heading', { name: model.submittedContent.common.title, exact: true })
      .waitFor();
    await page.getByText('Inspect current published material', { exact: true }).click();
    const published = page.locator('[data-published-content="' + exactA + '"]');
    await published.getByText('CC-BY-4.0', { exact: true }).waitFor();
    assert.equal(await published.getByText('New reviewed B overview', { exact: true }).count(), 0);
    await enabled(
      published.getByRole('button', { name: 'Download published file', exact: true }).first()
    );
    await published
      .getByRole('button', { name: 'Download published file', exact: true })
      .first()
      .click();
    await assertEventually(() =>
      requests.some(
        (request) => request.path.endsWith('/download-url') && request.body.contentId === exactA
      )
    );
    const downloaded = requests.findLast((request) => request.path.endsWith('/download-url'));
    assert.equal(downloaded.body.scope, 'PUBLISHED');
    assert.equal(downloaded.body.contentId, exactA);
    await published.getByRole('button', { name: 'Assess published material', exact: true }).click();
    await published.getByLabel('Legal & Compliance score', { exact: true }).fill('59');
    await published
      .getByLabel('Published assessment note', { exact: true })
      .fill('Withdraw published A, preserve correction B');
    flags.lose = 'assessment';
    await published.getByRole('button', { name: 'Save published assessment', exact: true }).click();
    await page.getByRole('region', { name: 'Unconfirmed review request' }).waitFor();
    const sent = requests.findLast(
      (request) => request.method === 'POST' && request.path.endsWith('/assessment')
    );
    assert.equal(sent.body.target, 'PUBLISHED');
    assert.equal(sent.body.expectedContentId, exactA);
    assert.equal(model.state.reviewedContentId, exactB);
    assert.equal(model.assessment, null);
    flags.lose = null;
    await page.reload();
    await page.getByRole('button', { name: 'Confirm previous request', exact: true }).click();
    await page.getByText('No current publication is selected.', { exact: false }).waitFor();
    const replay = requests.findLast(
      (request) => request.method === 'POST' && request.path.endsWith('/assessment')
    );
    assert.deepEqual(replay.body, sent.body);
    assert.equal(model.state.reviewedContentId, exactB);
  }
  console.log(
    'PASS all choices keep published A metadata/files/assessment separate from reviewed B; legal withdrawal and lost-ACK reload replay preserve the exact target and staged correction'
  );

  await page.goto(origin + '/dashboard/update-requests');
  await page.evaluate(() => window.mount('queue', 'updates'));
  const statusSelect = page.getByRole('combobox').filter({ hasText: 'All Statuses' });
  await statusSelect.click();
  await page.getByRole('option', { name: 'Published', exact: true }).click();
  await assertEventually(() =>
    requests.some(
      (request) =>
        request.path === '/api/v2/admin/dataset-proposals' &&
        request.query.reviewQueue === 'UPDATES' &&
        request.query.status === 'PUBLISHED'
    )
  );
  console.log(
    'PASS the existing managed Dataset queue exposes published records through its current status filter without changing default queue or action ownership'
  );

  const selectedQuestionDataset = id(99100),
    otherQuestionDataset = id(99101),
    selectedQuestion = id(99102);
  questionInventoryRows = [
    {
      datasetId: otherQuestionDataset,
      datasetTitle: 'Other Dataset on this page',
      questionCount: 1,
    },
  ];
  questionFixtures.set(selectedQuestionDataset, [
    {
      id: selectedQuestion,
      question: 'Question for the exact selected Dataset',
      createdAt: now,
      answers: [],
    },
  ]);
  await page.goto(origin + '/dashboard/questions?dataset=' + selectedQuestionDataset);
  await page.evaluate((dataset) => window.mount(dataset, 'questions'), selectedQuestionDataset);
  await page.getByText('Question for the exact selected Dataset', { exact: true }).waitFor();
  assert.equal(
    requests.some(
      (request) =>
        request.path === '/api/v1/marketplace/datasets/' + otherQuestionDataset + '/questions'
    ),
    false
  );
  await page
    .getByLabel('Answer question: Question for the exact selected Dataset', { exact: true })
    .fill('Answer belongs to the selected Dataset');
  await button(page, 'Answer').click();
  await page.getByText('Answer belongs to the selected Dataset', { exact: true }).waitFor();
  assert.equal(
    requests.findLast((request) => request.method === 'POST' && request.path.endsWith('/answers'))
      .path,
    '/api/v1/marketplace/questions/' + selectedQuestion + '/answers'
  );
  await page.getByRole('button', { name: 'Delete question', exact: true }).click();
  await page.getByLabel('Reason', { exact: true }).fill('Recorded moderation reason');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete question', exact: true })
    .click();
  await assertEventually(() =>
    requests.some(
      (request) =>
        request.method === 'DELETE' && request.path.endsWith('/questions/' + selectedQuestion)
    )
  );
  const priorQuestionReads = requests.filter((request) =>
    /\/datasets\/[^/]+\/questions$/.test(request.path)
  ).length;
  await page.goto(origin + '/dashboard/questions?dataset=..');
  await page.evaluate(() => window.mount('invalid', 'questions'));
  await page.getByRole('heading', { name: 'Questions', exact: true }).waitFor();
  assert.equal(
    requests.filter((request) => /\/datasets\/[^/]+\/questions$/.test(request.path)).length,
    priorQuestionReads
  );
  console.log(
    'PASS existing question moderation deep links target the requested Dataset outside the current inventory page; answer/delete keep exact question identity and invalid targets cannot select another Dataset'
  );

  const legacy = add('FULL_ONLY');
  legacy.readFailure = { code: 'NOT_FOUND', status: 404 };
  await page.goto(origin + '/review/' + legacy.state.datasetId);
  await page.locator('[data-legacy-review]').waitFor();
  const forbidden = add('FULL_ONLY');
  forbidden.readFailure = { code: 'FORBIDDEN', status: 403 };
  await page.goto(origin + '/review/' + forbidden.state.datasetId);
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('[data-legacy-review]').count(), 0);
  flags.mismatch = true;
  const mismatched = add('FULL_ONLY');
  await page.goto(origin + '/review/' + mismatched.state.datasetId);
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('[data-legacy-review]').count(), 0);
  flags.mismatch = false;
  console.log(
    'PASS only explicit canonical not-found selects the existing legacy route; denial and incompatible data never downgrade'
  );

  const limited = add('FULL_ONLY');
  await page.goto(origin + '/review/' + limited.state.datasetId);
  await enabled(button(page, 'Pick for review'));
  await page.evaluate(({ dataset, actor }) => window.mount(dataset, 'review', actor, 'ADMIN'), {
    dataset: limited.state.datasetId,
    actor: otherActorId,
  });
  await page
    .getByRole('heading', { name: limited.submittedContent.common.title, exact: true })
    .waitFor();
  assert.equal(await button(page, 'Pick for review').count(), 0);
  assert.equal(await button(page, 'Assess submitted material').isEnabled(), false);
  console.log(
    'PASS read-only administrator has no review or assessment authority in the UI; backend authorization remains authoritative'
  );

  for (let index = 0; index < 12; index++) add('FULL_ONLY');
  await page.evaluate((actor) => window.mount('unused', 'queue', actor), actorId);
  await page.getByRole('heading', { name: 'Dataset Proposals', exact: true }).waitFor();
  await assertEventually(() =>
    requests.some(
      (request) =>
        request.path === '/api/v2/admin/dataset-proposals' &&
        request.query.reviewQueue === 'PROPOSALS'
    )
  );
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.deepEqual(browserErrors, []);
  await enabled(button(page, 'Next'));
  await button(page, 'Next').click();
  await assertEventually(() =>
    requests.some(
      (request) => request.path === '/api/v2/admin/dataset-proposals' && request.query.page === '2'
    )
  );
  await page.getByText(new RegExp('Showing 11 to 20 of ' + models.size + ' proposals')).waitFor();
  console.log(
    'PASS existing proposal screen uses the canonical mixed global queue, server filter, global totals and next-page routing'
  );

  await page.evaluate(({ dataset, actor }) => window.mount(dataset, 'review', actor), {
    dataset: paid.state.datasetId,
    actor: actorId,
  });
  await page
    .getByRole('heading', { name: paid.submittedContent.common.title, exact: true })
    .waitFor();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(
      (theme) => document.documentElement.classList.toggle('dark', theme === 'dark'),
      theme
    );
    await page.screenshot({
      path: resolve(artifacts, `admin-content-${theme}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    'Narrow review does not overflow horizontally'
  );
  assert.deepEqual(
    await page.locator('#root button').evaluateAll((buttons) =>
      buttons
        .filter((button) => {
          const rect = button.getBoundingClientRect();
          return rect.width > 0 && (rect.right > innerWidth || rect.left < 0);
        })
        .map((button) => button.textContent)
    ),
    [],
    'Narrow controls remain visible, including within clipped panels'
  );
  await page.screenshot({ path: resolve(artifacts, 'admin-content-mobile.png'), fullPage: true });
  assert.deepEqual(errors, []);
  assert.deepEqual(browserErrors, []);
  console.log(
    'PASS existing tokens in light/dark/narrow layouts; no page errors, no hosted requests or production effects'
  );
} catch (error) {
  console.error(
    'Browser errors:',
    browserErrors,
    'Fixture errors:',
    errors,
    'Recent requests:',
    requests.slice(-8)
  );
  if (page) {
    await writeFile(resolve(artifacts, 'failure.html'), await page.content());
    await page.screenshot({ path: resolve(artifacts, 'failure.png') });
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
