/* Bulk delivery acceptance uses synthetic files and mocked API/storage only. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.CLARU_TEST_BASE_URL || 'http://localhost:3017';
const artifacts = process.env.CLARU_BULK_TEST_ARTIFACTS || '/tmp/claru-bulk-browser-review';
const now = '2026-09-28T10:00:00.000Z';
const project = {
  id: '92070f8b-acfb-44c2-8e73-1e6d9918a2b6',
  name: 'Commercial Egocentric Evaluation',
  checkGroups: { video: 'error', imu: 'off', stereo: 'off' },
  imuExpected: false,
  captureAspectRatio: '4_3',
  contractVersion: 2,
  clipLength: { minSeconds: 300, maxSeconds: 1800 },
  expectedFiles: [
    { fileType: 'video', required: true },
    { fileType: 'inputs', required: false },
    { fileType: 'other', required: false },
  ],
  categories: [
    { code: 'ACT-219', name: 'Preparing vegetables', parent: { name: 'Kitchen activities' } },
    { code: 'ACT-100', name: 'Washing dishes', parent: { name: 'Kitchen activities' } },
  ],
};
const batch = {
  id: 'batch-bulk-review',
  name: 'Kitchen bulk delivery',
  projectId: project.id,
  projectName: project.name,
  batchRef: 'CLR-BULK',
  defaults: {
    country: 'IN',
    collectorId: 'COL-001',
    siteId: 'SITE-001',
    device: 'GoPro HERO12',
    mount: 'Chest mount',
  },
  submissionCount: 0,
  createdById: 'admin-bulk',
  createdAt: now,
  updatedAt: now,
};
const syntheticVideo = (name, size = 12) => ({
  name,
  mimeType: 'video/mp4',
  buffer: Buffer.alloc(size, 1),
});
const results = [];
let browser;

function instructions(submission, model) {
  return submission.parts.map((part) => ({
    localPartId: part.id,
    claruPartId: part.claruPartId,
    fileType: part.fileType,
    fileName: part.fileName,
    byteSize: part.byteSize,
    uploadState: part.uploadState,
    upload:
      part.uploadState === 'uploaded'
        ? null
        : model.multipartFiles.has(part.fileName)
          ? {
              kind: 'multipart',
              uploadId: `upload-${part.id}`,
              partSizeBytes: 4,
              parts: Array.from({ length: Math.ceil(Number(part.byteSize) / 4) }, (_, index) => ({
                partNumber: index + 1,
                url: `https://claru-test.s3.amazonaws.com/${part.id}/${index + 1}`,
              })),
              headers: {},
              expiresAt: '2099-01-01T00:00:00.000Z',
            }
          : {
              kind: 'put',
              url: `https://claru-test.s3.amazonaws.com/${part.id}`,
              headers: {
                'x-amz-meta-source': 'supplier_upload',
                ...(part.fileType === 'video' ? { 'content-type': 'video/mp4' } : {}),
              },
              expiresAt: '2099-01-01T00:00:00.000Z',
            },
  }));
}

async function scenario(name, run, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const model = {
    userId: 'admin-bulk',
    userType: 'SUPERADMIN',
    authenticated: true,
    permissions: [],
    submissions: new Map(),
    requests: [],
    storage: [],
    multipartFiles: new Set(),
    failedFiles: new Set(),
    heldFiles: new Set(),
    heldCreateRefs: new Set(),
    heldRequests: [],
    activeStorage: 0,
    maxActiveStorage: 0,
    dialogs: [],
    ...options,
  };
  page.on('dialog', async (dialog) => {
    model.dialogs.push(dialog.type());
    if (dialog.type() === 'beforeunload') await dialog.accept();
    else await dialog.dismiss();
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname;
    const body = request.postDataJSON();
    model.requests.push({ endpoint, method: request.method(), body });
    let data;
    if (endpoint.endsWith('/auth/me')) {
      if (!model.authenticated)
        return route.fulfill({
          status: 401,
          json: { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
        });
      data = {
        user: {
          id: model.userId,
          email: 'bulk-review@example.test',
          userType: model.userType,
          status: 'ACTIVE',
          emailVerified: true,
        },
      };
    } else if (endpoint.endsWith('/auth/logout')) {
      model.authenticated = false;
      data = {};
    } else if (endpoint.endsWith('/my-permissions')) data = { permissions: model.permissions };
    else if (endpoint.endsWith('/me/profile')) data = { profile: null };
    else if (endpoint.endsWith('/claru/projects')) {
      data = {
        team: {
          name: 'Kuinbee',
          status: 'active',
          ...(model.blocked
            ? { blocked: { code: 'TEAM_BLOCKED', remedy: 'Contact Claru to restore team access.' } }
            : {}),
        },
        contract: { version: 2, minAcceptedVersion: 1 },
        rateLimit: { requestsPerMinute: 600 },
        projects: [project],
      };
    } else if (endpoint.endsWith('/claru/batches')) {
      data = { items: [batch], page: 1, pageSize: 20, total: 1 };
    } else if (endpoint.endsWith(`/batches/${batch.id}`)) {
      data = { ...batch, submissionCount: model.submissions.size };
    } else if (endpoint.endsWith(`/batches/${batch.id}/submissions`)) {
      assert.equal(request.method(), 'POST');
      let submission = [...model.submissions.values()].find(
        (item) => item.externalRef === body.externalRef
      );
      if (!submission) {
        const id = `submission-${model.submissions.size + 1}`;
        submission = {
          id,
          batchId: batch.id,
          projectId: project.id,
          externalRef: body.externalRef,
          declared: body.declared,
          claruSubmissionId: `remote-${id}`,
          contractVersion: 2,
          state: 'draft',
          sealed: false,
          annotationId: null,
          seal: null,
          lastRefusal: null,
          rejection: null,
          version: 1,
          sealedAt: null,
          lastSyncedAt: now,
          createdAt: now,
          updatedAt: now,
          parts: body.parts.map((part, index) => ({
            ...part,
            id: `${id}-part-${index}`,
            claruPartId: `remote-${id}-part-${index}`,
            uploadState: 'pending',
            uploadKind: model.multipartFiles.has(part.fileName) ? 'multipart' : 'put',
            partSizeBytes: model.multipartFiles.has(part.fileName) ? '4' : null,
            uploadedParts: [],
            uploadExpiresAt: '2099-01-01T00:00:00.000Z',
            completedAt: null,
          })),
        };
        model.submissions.set(id, submission);
      } else {
        submission.declared = body.declared;
        assert.deepEqual(
          body.parts.map((part) => [part.fileName, part.byteSize]),
          submission.parts.map((part) => [part.fileName, part.byteSize]),
          'retry retains the declared file identities'
        );
      }
      data = { submission, uploadInstructions: instructions(submission, model) };
      if (model.heldCreateRefs.has(body.externalRef))
        await new Promise((resolve) => model.heldRequests.push(resolve));
    } else if (endpoint.endsWith('/claru/submissions')) {
      data = {
        items: [...model.submissions.values()],
        page: 1,
        pageSize: 50,
        total: model.submissions.size,
      };
    } else if (endpoint.includes('/claru/submissions/')) {
      const match = endpoint.match(/\/claru\/submissions\/([^/]+)/);
      const submission = model.submissions.get(match[1]);
      assert.ok(submission, `known submission: ${endpoint}`);
      if (endpoint.endsWith('/checkpoint')) {
        const partId = endpoint.split('/').at(-2);
        const part = submission.parts.find((item) => item.id === partId);
        part.uploadedParts = part.uploadedParts.filter(
          (item) => item.partNumber !== body.partNumber
        );
        part.uploadedParts.push({ partNumber: body.partNumber, etag: body.etag });
        data = part;
      } else if (endpoint.endsWith('/complete')) {
        const partId = endpoint.split('/').at(-2);
        const part = submission.parts.find((item) => item.id === partId);
        assert.ok(part, 'complete matches a declared part');
        part.uploadState = 'uploaded';
        part.completedAt = now;
        data = submission;
      } else if (endpoint.endsWith('/seal')) {
        throw new Error('The bulk upload queue must not seal automatically');
      } else data = submission;
    } else data = {};
    return route.fulfill({ json: { success: true, data } });
  });
  await context.route('https://claru-test.s3.amazonaws.com/**', async (route) => {
    const request = route.request();
    const [partId, slice] = new URL(request.url()).pathname.slice(1).split('/');
    const part = [...model.submissions.values()]
      .flatMap((submission) => submission.parts)
      .find((item) => item.id === partId);
    assert.ok(part, 'storage PUT matches a declared part');
    model.storage.push({
      partId,
      slice,
      fileName: part.fileName,
      method: request.method(),
      headers: request.headers(),
      bytes: request.postDataBuffer()?.length,
    });
    model.activeStorage++;
    model.maxActiveStorage = Math.max(model.maxActiveStorage, model.activeStorage);
    try {
      if (model.heldFiles.has(part.fileName))
        await new Promise((resolve) => model.heldRequests.push(resolve));
      if (model.failedFiles.has(part.fileName))
        return route.fulfill({ status: 403, body: 'Expired signature' });
      return route.fulfill({
        status: 200,
        headers: {
          ETag: `"test-etag-${slice || 'put'}"`,
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        },
        body: '',
      });
    } finally {
      model.activeStorage--;
    }
  });
  try {
    await run(page, model);
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    assert.equal(model.requests.filter((request) => request.endpoint.endsWith('/seal')).length, 0);
    results.push({ name, result: 'PASS' });
    console.log(`PASS ${name}`);
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true });
    console.error((await page.locator('body').innerText()).slice(-7000));
    throw new Error(`${name}: ${error.message}`, { cause: error });
  } finally {
    model.heldRequests.forEach((resolve) => resolve());
    await context.close();
  }
}

async function ready(page) {
  await page.goto(`${base}/dashboard/claru/batches/${batch.id}`);
  await page.getByRole('heading', { level: 1, name: batch.name, exact: true }).waitFor();
}

async function chooseCategory(page, locator, name = 'Preparing vegetables') {
  await locator.click();
  await page.getByRole('combobox', { name: 'Search activity categories' }).fill(name);
  await page.getByRole('option', { name: new RegExp(name) }).click();
}

async function selectVideos(page, files) {
  await page.getByRole('button', { name: 'Bulk upload', exact: true }).click();
  await page.locator('#claru-bulk-videos').setInputFiles(files);
  await chooseCategory(page, page.getByLabel('Category for selected clips', { exact: true }));
  await page.getByLabel('Duration for selected clips (minutes)', { exact: true }).fill('10.25');
  await page
    .getByLabel('Recorded at for selected clips (local time)', { exact: true })
    .fill('2026-09-28T12:45:30');
  await page.getByLabel('Reference prefix', { exact: true }).fill('bulk-review');
  await page
    .getByRole('button', { name: 'Apply shared details to all clips', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.check();
  return dialog;
}

async function enqueue(page, count) {
  await page
    .getByRole('button', {
      name: `Add ${count} ${count === 1 ? 'clip' : 'clips'} to queue`,
      exact: true,
    })
    .click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    `${name} has no horizontal page overflow`
  );
}

const createRequests = (model) =>
  model.requests.filter((request) => request.endpoint.endsWith(`/batches/${batch.id}/submissions`));
const completeRequests = (model) =>
  model.requests.filter((request) => request.endpoint.endsWith('/complete'));
const queueRow = (page, reference) =>
  page.locator('[data-claru-queue-row]').filter({ hasText: reference });

async function waitFor(check, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  assert.fail(message);
}

async function startQueue(page) {
  await page.getByRole('button', { name: 'Start queue', exact: true }).first().click();
}

async function allReady(page, model, count, checkUi = true) {
  await waitFor(
    () =>
      model.submissions.size === count &&
      [...model.submissions.values()].every((submission) =>
        submission.parts.every((part) => part.uploadState === 'uploaded')
      ),
    `${count} submissions finish uploading`
  );
  if (checkUi) {
    const last = [...model.submissions.values()].at(-1);
    await queueRow(page, last.externalRef)
      .getByText('Ready to seal', { exact: true })
      .first()
      .waitFor();
  }
  assert.ok([...model.submissions.values()].every((submission) => !submission.sealed));
}

await fs.mkdir(artifacts, { recursive: true });
browser = await chromium.launch({ headless: true });

try {
  await scenario(
    'bulk selection reviews each clip and preserves truthful declarations',
    async (page, model) => {
      await ready(page);
      const files = ['vegetables.mp4', 'dishes.mp4', 'cleanup.mp4'].map((name) =>
        syntheticVideo(name)
      );
      const dialog = await selectVideos(page, files);
      assert.equal(await dialog.locator('[data-claru-bulk-row]').count(), 3);
      await page.getByLabel('Clip 1 external reference', { exact: true }).fill('bulk-vegetables');
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('bulk-dishes');
      await page.getByLabel('Clip 3 external reference', { exact: true }).fill('bulk-cleanup');
      await chooseCategory(
        page,
        page.getByLabel('Clip 2 category', { exact: true }),
        'Washing dishes'
      );
      await page.getByLabel('Clip 2 duration in minutes', { exact: true }).fill('2');
      await page
        .getByLabel('Clip 3 recorded at (local time)', { exact: true })
        .fill('2026-09-28T13:15:42');
      await screenshot(page, 'bulk-review-desktop');
      await enqueue(page, 3);
      assert.equal(createRequests(model).length, 0, 'review only adds clips to the queue');
      await startQueue(page);
      await allReady(page, model, 3);
      const requests = createRequests(model);
      assert.equal(requests.length, 3, 'one create request per clip');
      assert.deepEqual(
        requests.map((request) => request.body.externalRef),
        ['bulk-vegetables', 'bulk-dishes', 'bulk-cleanup']
      );
      assert.equal(requests[0].body.declared.categoryCode, 'ACT-219');
      assert.equal(requests[1].body.declared.categoryCode, 'ACT-100');
      assert.equal(
        requests[1].body.declared.durationSeconds,
        120,
        'declaration outside media range remains truthful'
      );
      assert.equal(
        requests[2].body.declared.recordedAt,
        new Date('2026-09-28T13:15:42').toISOString()
      );
      for (const request of requests) {
        assert.equal(request.body.declared.country, 'IN');
        assert.equal(request.body.declared.collectorId, 'COL-001');
        assert.equal(request.body.parts.length, 1, 'every selected video is a separate clip');
        assert.ok(Object.values(request.body.declared.consent).every((value) => value === true));
      }
      assert.equal(model.storage.length, 3);
      assert.ok(model.storage.every((put) => put.method === 'PUT' && put.bytes === 12));
      assert.ok(
        model.storage.every((put) => put.headers['x-amz-meta-source'] === 'supplier_upload')
      );
      assert.ok(model.storage.every((put) => put.headers['content-type'] === 'video/mp4'));
      await screenshot(page, 'bulk-queue-ready-desktop');
    }
  );

  await scenario(
    'duplicates and incomplete consent cannot enter the upload queue',
    async (page, model) => {
      await ready(page);
      const dialog = await selectVideos(page, [
        syntheticVideo('first.mp4'),
        syntheticVideo('second.mp4'),
      ]);
      await page
        .getByLabel('Clip 1 external reference', { exact: true })
        .fill('duplicate-reference');
      await page
        .getByLabel('Clip 2 external reference', { exact: true })
        .fill('duplicate-reference');
      await page.getByRole('button', { name: 'Add 2 clips to queue', exact: true }).click();
      await dialog
        .getByText(/different external reference|unique|duplicate|already/i)
        .first()
        .waitFor();
      assert.equal(createRequests(model).length, 0);
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('second-reference');
      await dialog.getByRole('checkbox').first().uncheck();
      await page.getByRole('button', { name: 'Add 2 clips to queue', exact: true }).click();
      await dialog
        .getByText(/all four|consent/i)
        .last()
        .waitFor();
      assert.equal(await dialog.isVisible(), true);
      assert.equal(createRequests(model).length, 0);
      await dialog.getByRole('checkbox').first().check();
      await enqueue(page, 2);
      await startQueue(page);
      await allReady(page, model, 2);
    }
  );

  await scenario(
    'one failed clip does not block later clips and retries reuse the same reference',
    async (page, model) => {
      await ready(page);
      await selectVideos(
        page,
        ['first.mp4', 'broken.mp4', 'last.mp4'].map((name) => syntheticVideo(name))
      );
      await page.getByLabel('Clip 1 external reference', { exact: true }).fill('first-reference');
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('broken-reference');
      await page.getByLabel('Clip 3 external reference', { exact: true }).fill('last-reference');
      model.failedFiles.add('broken.mp4');
      await enqueue(page, 3);
      await startQueue(page);
      await waitFor(
        () => model.submissions.size === 3 && completeRequests(model).length === 2,
        'siblings finish despite one storage failure'
      );
      await queueRow(page, 'broken-reference')
        .getByRole('button', { name: 'Retry broken-reference', exact: true })
        .waitFor();
      await screenshot(page, 'bulk-queue-isolated-failure');
      model.failedFiles.clear();
      await page.getByRole('button', { name: 'Retry failed', exact: true }).first().click();
      await allReady(page, model, 3);
      assert.equal(model.submissions.size, 3, 'retry creates no duplicate submission');
      assert.equal(
        createRequests(model).filter((request) => request.body.externalRef === 'broken-reference')
          .length,
        2
      );
      assert.equal(
        createRequests(model).filter((request) => request.body.externalRef === 'first-reference')
          .length,
        1
      );
      assert.equal(
        createRequests(model).filter((request) => request.body.externalRef === 'last-reference')
          .length,
        1
      );
      assert.equal(completeRequests(model).length, 3);
    }
  );

  await scenario(
    'pausing the queue aborts an active upload and resume completes without duplicates',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('pause.mp4'), syntheticVideo('next.mp4')]);
      await page.getByLabel('Clip 1 external reference', { exact: true }).fill('pause-reference');
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('next-reference');
      model.heldFiles.add('pause.mp4');
      model.heldFiles.add('next.mp4');
      await enqueue(page, 2);
      await startQueue(page);
      await waitFor(() => model.storage.length > 0, 'storage upload starts');
      await page.getByRole('button', { name: 'Pause queue', exact: true }).first().click();
      assert.equal(completeRequests(model).length, 0, 'aborted PUT is not completed');
      const requestCount = createRequests(model).length;
      const storageCount = model.storage.length;
      model.heldFiles.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.equal(
        createRequests(model).length,
        requestCount,
        'paused queue does not start another clip'
      );
      assert.equal(model.storage.length, storageCount);
      await page.getByRole('button', { name: 'Resume queue', exact: true }).first().click();
      await allReady(page, model, 2);
      assert.equal(model.submissions.size, 2);
      assert.equal(completeRequests(model).length, 2);
    }
  );

  await scenario('queue uploads continue across dashboard navigation', async (page, model) => {
    await ready(page);
    await selectVideos(page, [syntheticVideo('navigation.mp4')]);
    await page
      .getByLabel('Clip 1 external reference', { exact: true })
      .fill('navigation-reference');
    model.heldFiles.add('navigation.mp4');
    await enqueue(page, 1);
    await startQueue(page);
    await waitFor(() => model.storage.length === 1, 'upload is active');
    await page.getByRole('button', { name: 'Back to Claru deliveries', exact: true }).click();
    await page.waitForURL('**/dashboard/claru');
    model.heldFiles.clear();
    model.heldRequests.splice(0).forEach((resolve) => resolve());
    await page.getByRole('button', { name: /^Upload queue, \d+ unfinished clips$/ }).click();
    await allReady(page, model, 1);
    await queueRow(page, 'navigation-reference')
      .getByRole('link', { name: 'Open clip', exact: true })
      .waitFor();
    assert.equal(model.storage.length, 1, 'navigation did not abort or restart the PUT');
    await screenshot(page, 'bulk-queue-global');
  });

  await scenario(
    'pausing one clip lets its siblings finish and its detail avoids duplicate transfers',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('individual.mp4'), syntheticVideo('sibling.mp4')]);
      await page
        .getByLabel('Clip 1 external reference', { exact: true })
        .fill('individual-reference');
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('sibling-reference');
      model.heldFiles.add('individual.mp4');
      await enqueue(page, 2);
      await startQueue(page);
      await waitFor(() => model.storage.length === 1, 'first clip upload starts');
      await queueRow(page, 'individual-reference')
        .getByRole('link', { name: 'Open clip', exact: true })
        .click();
      await page.waitForURL('**/dashboard/claru/submissions/submission-1');
      await page
        .getByText('This clip is managed by the bulk upload queue.', { exact: false })
        .waitFor();
      assert.equal(
        await page.getByRole('button', { name: 'Start upload', exact: true }).count(),
        0
      );
      assert.equal(
        await page.getByRole('button', { name: 'Seal submission', exact: true }).count(),
        0
      );
      await queueRow(page, 'individual-reference')
        .getByRole('button', { name: 'Pause individual-reference', exact: true })
        .click();
      model.heldFiles.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await queueRow(page, 'sibling-reference')
        .getByText('Ready to seal', { exact: true })
        .waitFor();
      assert.equal(
        completeRequests(model).length,
        1,
        'individual pause leaves the remaining queue running'
      );
      await queueRow(page, 'individual-reference')
        .getByRole('button', { name: 'Resume individual-reference', exact: true })
        .click();
      await allReady(page, model, 2, false);
      await page.getByRole('button', { name: 'Seal submission', exact: true }).waitFor();
      assert.equal(model.submissions.size, 2);
      assert.equal(completeRequests(model).length, 2);
    }
  );

  await scenario(
    'existing draft is protected while its queued retry waits for a create response',
    async (page, model) => {
      const reference = 'existing-draft-reference';
      model.submissions.set('existing-draft', {
        id: 'existing-draft',
        batchId: batch.id,
        projectId: project.id,
        externalRef: reference,
        declared: {
          ...batch.defaults,
          categoryCode: 'ACT-219',
          recordedAt: now,
          durationSeconds: 615,
          consent: {
            worker_consent_obtained: true,
            site_or_employer_permission_obtained: true,
            required_consent_or_notice_process_followed: true,
            footage_unedited: true,
          },
        },
        claruSubmissionId: 'remote-existing-draft',
        contractVersion: 2,
        state: 'draft',
        sealed: false,
        annotationId: null,
        seal: null,
        lastRefusal: null,
        rejection: null,
        version: 1,
        sealedAt: null,
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
        parts: [
          {
            id: 'existing-draft-part',
            clientPartId: '550e8400-e29b-41d4-a716-446655440000',
            claruPartId: 'remote-existing-draft-part',
            fileType: 'video',
            fileName: 'existing.mp4',
            byteSize: '12',
            uploadState: 'uploaded',
            uploadKind: 'put',
            partSizeBytes: null,
            uploadedParts: [],
            uploadExpiresAt: null,
            completedAt: now,
          },
        ],
      });
      await ready(page);
      await selectVideos(page, [syntheticVideo('existing.mp4')]);
      await page.getByLabel('Clip 1 external reference', { exact: true }).fill(reference);
      await enqueue(page, 1);
      model.heldCreateRefs.add(reference);
      await startQueue(page);
      await waitFor(
        () => createRequests(model).length === 1 && model.heldRequests.length === 1,
        'create waits for the mocked response'
      );
      const saved = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('kuinbee:claru-upload-queue:v1'))
      );
      assert.equal(
        saved.items[0].submissionId,
        undefined,
        'queue has no returned submission ID yet'
      );
      await page.getByRole('link', { name: reference, exact: true }).click();
      await page.waitForURL('**/dashboard/claru/submissions/existing-draft');
      await page
        .getByText('This clip is managed by the bulk upload queue.', { exact: false })
        .waitFor();
      assert.equal(
        await page.getByRole('button', { name: 'Seal submission', exact: true }).count(),
        0
      );
      assert.equal(
        await page.getByRole('button', { name: 'Correct submission', exact: true }).count(),
        0
      );
      assert.equal(
        await page.getByRole('button', { name: 'Resume upload', exact: true }).count(),
        0
      );
      assert.equal(model.storage.length, 0);
      await page.getByRole('button', { name: 'Pause queue', exact: true }).click();
      model.heldCreateRefs.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await queueRow(page, reference).getByText('Paused', { exact: true }).waitFor();
      assert.equal(createRequests(model).length, 1);
      assert.equal(completeRequests(model).length, 0);
      assert.equal(model.storage.length, 0);
    }
  );

  await scenario(
    'view-only admins cannot bulk upload',
    async (page, model) => {
      await ready(page);
      assert.equal(await page.getByRole('button', { name: 'Bulk upload', exact: true }).count(), 0);
      assert.equal(createRequests(model).length, 0);
      assert.equal(await page.getByRole('button', { name: 'Start queue', exact: true }).count(), 0);
    },
    { userType: 'ADMIN', permissions: ['VIEW_CLARU_DELIVERIES'] }
  );

  await scenario(
    'seal-only admins cannot bulk upload',
    async (page, model) => {
      await ready(page);
      assert.equal(await page.getByRole('button', { name: 'Bulk upload', exact: true }).count(), 0);
      assert.equal(createRequests(model).length, 0);
    },
    { userType: 'ADMIN', permissions: ['SEAL_CLARU_DELIVERIES'] }
  );

  await scenario(
    'multipart queue follows supplied slices, checkpoints, and four-worker limit',
    async (page, model) => {
      await ready(page);
      model.multipartFiles.add('multipart.mp4');
      await selectVideos(page, [syntheticVideo('multipart.mp4', 20), syntheticVideo('plain.mp4')]);
      await page
        .getByLabel('Clip 1 external reference', { exact: true })
        .fill('multipart-reference');
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('plain-reference');
      await enqueue(page, 2);
      model.heldFiles.add('multipart.mp4');
      await startQueue(page);
      await waitFor(() => model.storage.length === 4, 'four multipart workers start together');
      assert.equal(model.maxActiveStorage, 4);
      assert.equal(createRequests(model).length, 1, 'the next clip waits for the active clip');
      model.heldFiles.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await allReady(page, model, 2);
      const slices = model.storage.filter((request) => request.fileName === 'multipart.mp4');
      assert.equal(slices.length, 5);
      assert.deepEqual(
        slices.map((request) => Number(request.slice)).sort((a, b) => a - b),
        [1, 2, 3, 4, 5]
      );
      assert.ok(slices.every((request) => request.bytes === 4));
      assert.ok(slices.every((request) => request.headers['content-type'] === undefined));
      assert.ok(slices.every((request) => request.headers['x-amz-meta-source'] === undefined));
      assert.ok(
        model.maxActiveStorage <= 4,
        'one clip and at most four multipart slices upload together'
      );
      const checkpoints = model.requests.filter((request) =>
        request.endpoint.endsWith('/checkpoint')
      );
      assert.equal(checkpoints.length, 5);
      assert.ok(checkpoints.every((request) => request.body.uploadId.startsWith('upload-')));
      assert.ok(checkpoints.every((request) => /^"test-etag-\d+"$/.test(request.body.etag)));
      assert.equal(completeRequests(model).length, 2);
    }
  );

  await scenario(
    'refresh retains queue metadata and requires exact files before resuming',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('recover.mp4'), syntheticVideo('pending.mp4')]);
      await page.getByLabel('Clip 1 external reference', { exact: true }).fill('recover-reference');
      await page.getByLabel('Clip 2 external reference', { exact: true }).fill('pending-reference');
      model.heldFiles.add('recover.mp4');
      await enqueue(page, 2);
      await startQueue(page);
      await waitFor(() => model.storage.length === 1, 'first upload starts');
      await page.getByRole('button', { name: 'Pause queue', exact: true }).first().click();
      const persisted = await page.evaluate(() =>
        sessionStorage.getItem('kuinbee:claru-upload-queue:v1')
      );
      const saved = JSON.parse(persisted);
      assert.equal(saved.items.length, 2);
      assert.equal(saved.ownerId, 'admin-bulk');
      assert.ok(saved.items.every((item) => !('filesByClientPartId' in item)));
      assert.equal(
        persisted.includes('claru-test.s3.amazonaws.com'),
        false,
        'signed URLs stay out of browser storage'
      );
      model.heldFiles.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await page.reload();
      await queueRow(page, 'recover-reference')
        .getByRole('button', { name: 'Reselect files for recover-reference', exact: true })
        .waitFor();
      assert.equal(
        createRequests(model).length,
        1,
        'refresh does not recreate unfinished clips automatically'
      );
      assert.equal(completeRequests(model).length, 0);
      await queueRow(page, 'recover-reference')
        .getByRole('button', { name: 'Reselect files for recover-reference', exact: true })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('input[type=file]').setInputFiles(syntheticVideo('recover.mp4', 13));
      await dialog.getByRole('button', { name: 'Restore files', exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(await dialog.isVisible(), true, 'wrong file size cannot be restored');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page
        .getByLabel('Reselect queue files', { exact: true })
        .setInputFiles([syntheticVideo('recover.mp4'), syntheticVideo('pending.mp4')]);
      await queueRow(page, 'recover-reference').getByText('Paused', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Resume queue', exact: true }).first().click();
      await allReady(page, model, 2);
      assert.equal(model.submissions.size, 2);
      assert.equal(
        createRequests(model).filter((request) => request.body.externalRef === 'recover-reference')
          .length,
        2
      );
      assert.equal(
        createRequests(model).filter((request) => request.body.externalRef === 'pending-reference')
          .length,
        1
      );
    }
  );

  await scenario(
    'a different authenticated admin cannot restore another admins queue',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('private.mp4')]);
      await page.getByLabel('Clip 1 external reference', { exact: true }).fill('private-reference');
      await enqueue(page, 1);
      model.userId = 'different-admin';
      await page.reload();
      await page.getByRole('heading', { level: 1, name: batch.name, exact: true }).waitFor();
      assert.equal(await page.locator('[data-claru-queue-row]').count(), 0);
      assert.equal(createRequests(model).length, 0);
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem('kuinbee:claru-upload-queue:v1')),
        null
      );
    }
  );

  await scenario(
    'session expiry aborts active queue work and clears local capture metadata',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('expired.mp4'), syntheticVideo('never-start.mp4')]);
      model.heldFiles.add('expired.mp4');
      await enqueue(page, 2);
      await startQueue(page);
      await waitFor(() => model.storage.length === 1, 'upload starts before session expires');
      model.authenticated = false;
      await page.evaluate(() => window.dispatchEvent(new Event('kuinbee:session-expired')));
      await page.waitForURL('**/login');
      await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
      model.heldFiles.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.equal(completeRequests(model).length, 0);
      assert.equal(createRequests(model).length, 1);
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem('kuinbee:claru-upload-queue:v1')),
        null
      );
    }
  );

  await scenario(
    'logging out aborts uploads and removes the queue for the next login',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('logout.mp4'), syntheticVideo('after-logout.mp4')]);
      model.heldFiles.add('logout.mp4');
      await enqueue(page, 2);
      await startQueue(page);
      await waitFor(() => model.storage.length === 1, 'upload starts before logout');
      await page.getByRole('button', { name: /Superadmin/ }).click();
      await page.getByRole('menuitem', { name: 'Log out', exact: true }).click();
      await page.waitForURL('**/login');
      await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
      model.heldFiles.clear();
      model.heldRequests.splice(0).forEach((resolve) => resolve());
      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.equal(completeRequests(model).length, 0);
      assert.equal(createRequests(model).length, 1);
      assert.equal(
        await page.evaluate(() => sessionStorage.getItem('kuinbee:claru-upload-queue:v1')),
        null
      );
      assert.equal(
        model.requests.filter((request) => request.endpoint.endsWith('/auth/logout')).length,
        1
      );
    }
  );

  await scenario(
    'manage permission uploads without sealing',
    async (page, model) => {
      await ready(page);
      await selectVideos(page, [syntheticVideo('manage.mp4')]);
      await enqueue(page, 1);
      await startQueue(page);
      await allReady(page, model, 1);
      assert.equal(
        await page.getByRole('button', { name: 'Seal submission', exact: true }).count(),
        0
      );
    },
    { userType: 'ADMIN', permissions: ['MANAGE_CLARU_DELIVERIES'] }
  );

  await scenario(
    'related files and capture exceptions remain attached to their own clip',
    async (page, model) => {
      await ready(page);
      const dialog = await selectVideos(page, [
        syntheticVideo('imu.mp4'),
        syntheticVideo('plain.mp4'),
      ]);
      const row = dialog.locator('[data-claru-bulk-row]').first();
      await row.locator('summary').click();
      await page.getByLabel('Clip 1 device', { exact: true }).fill('GoPro HERO13');
      await page.getByLabel('Clip 1 imu inputs', { exact: true }).setInputFiles({
        name: 'motion.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('time_us,ax,ay,az,gx,gy,gz\n0,0,0,9.8,0,0,0\n'),
      });
      await page.getByLabel('Clip 1 IMU axis convention', { exact: true }).fill('RDF');
      await page.getByLabel('Clip 1 video start, microseconds', { exact: true }).fill('123456789');
      for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.check();
      await enqueue(page, 2);
      await startQueue(page);
      await allReady(page, model, 2);
      const requests = createRequests(model);
      assert.equal(requests[0].body.parts.length, 2);
      assert.equal(requests[1].body.parts.length, 1);
      assert.equal(requests[0].body.declared.device, 'GoPro HERO13');
      assert.equal(requests[1].body.declared.device, 'GoPro HERO12');
      assert.deepEqual(requests[0].body.declared.imu, {
        axisConvention: 'RDF',
        videoStartUs: 123456789,
      });
      assert.equal(requests[1].body.declared.imu, undefined);
      const sidecar = model.storage.find((put) => put.fileName === 'motion.csv');
      assert.ok(sidecar);
      assert.equal(
        sidecar.headers['content-type'],
        undefined,
        'upload sends only the signed sidecar headers'
      );
      assert.equal(completeRequests(model).length, 3);
    }
  );

  await scenario(
    'large selections paginate review and queue without dropping clips',
    async (page, model) => {
      await ready(page);
      const dialog = await selectVideos(
        page,
        Array.from({ length: 25 }, (_, index) => syntheticVideo(`large-${index + 1}.mp4`))
      );
      assert.equal(await dialog.locator('[data-claru-bulk-row]').count(), 20);
      await dialog.getByRole('button', { name: 'Next clips', exact: true }).click();
      assert.equal(await dialog.locator('[data-claru-bulk-row]').count(), 5);
      await page
        .getByLabel('Clip 25 external reference', { exact: true })
        .fill('last-large-reference');
      await enqueue(page, 25);
      const persisted = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('kuinbee:claru-upload-queue:v1'))
      );
      assert.equal(persisted.items.length, 25);
      assert.equal(persisted.items.at(-1).input.externalRef, 'last-large-reference');
      assert.equal(await page.locator('[data-claru-queue-row]').count(), 20);
      await page
        .getByRole('region', { name: 'Batch upload queue', exact: true })
        .getByRole('button', { name: 'Next', exact: true })
        .click();
      assert.equal(await page.locator('[data-claru-queue-row]').count(), 5);
      await queueRow(page, 'last-large-reference').waitFor();
      assert.equal(
        createRequests(model).length,
        0,
        'large queue remains under explicit admin control'
      );
    }
  );

  await scenario(
    'blocked team cannot add bulk clips',
    async (page, model) => {
      await ready(page);
      await page.getByText('Contact Claru to restore team access.', { exact: false }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Bulk upload', exact: true }).count(), 0);
      assert.equal(createRequests(model).length, 0);
    },
    { blocked: true }
  );

  await scenario('bulk review and queue fit mobile, tablet, and dark mode', async (page, model) => {
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await ready(page);
      await selectVideos(page, [syntheticVideo(`mobile-${width}.mp4`)]);
      await screenshot(page, `bulk-review-${width}`);
      await enqueue(page, 1);
      await screenshot(page, `bulk-queue-${width}`);
    }
    await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await screenshot(page, 'bulk-queue-dark');
    assert.equal(createRequests(model).length, 0, 'queue stays idle until the admin starts it');
  });

  await fs.writeFile(path.join(artifacts, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length} bulk browser scenarios passed. Artifacts: ${artifacts}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
