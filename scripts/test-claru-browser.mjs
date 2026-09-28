/* Browser acceptance with synthetic media and mocked APIs. Never calls Claru. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.CLARU_TEST_BASE_URL || 'http://localhost:3017';
const artifacts = process.env.CLARU_TEST_ARTIFACTS || '/tmp/claru-browser-review';
const now = '2026-09-27T10:00:00.000Z';
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
  categories: Array.from({ length: 220 }, (_, index) => ({
    code: `ACT-${index}`,
    name: index === 219 ? 'Preparing vegetables' : `Activity ${String(index).padStart(3, '0')}`,
    parent: { id: 'parent', name: 'Kitchen activities' },
  })),
};
const batch = {
  id: 'batch-review',
  name: 'September kitchen delivery',
  projectId: project.id,
  projectName: project.name,
  batchRef: 'CLR-009',
  defaults: {
    country: 'IN',
    collectorId: 'COL-001',
    siteId: 'SITE-001',
    device: 'GoPro HERO12',
    mount: 'Chest mount',
  },
  submissionCount: 1,
  createdById: 'admin',
  createdAt: now,
  updatedAt: now,
};
const declared = {
  categoryCode: 'ACT-219',
  ...batch.defaults,
  recordedAt: now,
  durationSeconds: 603.4,
  consent: {
    worker_consent_obtained: true,
    site_or_employer_permission_obtained: true,
    required_consent_or_notice_process_followed: true,
    footage_unedited: true,
  },
};
const initialSubmission = () => ({
  id: 'submission-review',
  batchId: batch.id,
  projectId: project.id,
  externalRef: 'kitchen-2026-09-27-0031',
  declared: structuredClone(declared),
  claruSubmissionId: 'remote-submission',
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
      id: 'part-review',
      clientPartId: '550e8400-e29b-41d4-a716-446655440000',
      claruPartId: 'remote-part',
      fileType: 'video',
      fileName: 'capture.mp4',
      byteSize: '12',
      uploadState: 'pending',
      uploadKind: 'put',
      partSizeBytes: null,
      uploadedParts: [],
      uploadExpiresAt: now,
      completedAt: null,
    },
  ],
});
const results = [];
let browser;

async function scenario(name, run, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const model = { submission: initialSubmission(), requests: [], storage: [], ...options };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const endpoint = url.pathname;
    const body = request.postDataJSON();
    model.requests.push({ endpoint, method: request.method(), body });
    let data;
    if (endpoint.endsWith('/auth/me'))
      data = {
        user: {
          id: 'admin',
          email: 'review@example.test',
          userType: model.userType || 'SUPERADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      };
    else if (endpoint.endsWith('/my-permissions')) data = { permissions: model.permissions || [] };
    else if (endpoint.endsWith('/me/profile')) data = { profile: null };
    else if (endpoint.endsWith('/claru/projects')) {
      if (model.discoveryError)
        return route.fulfill({
          status: 503,
          json: { success: false, error: { code: 'CLARU_UNAVAILABLE', message: 'Unavailable' } },
        });
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
        projects: model.emptyProjects ? [] : [project],
      };
    } else if (endpoint.endsWith('/claru/batches'))
      data =
        request.method() === 'POST'
          ? { ...batch, ...body }
          : {
              items: model.emptyBatches ? [] : [batch],
              page: 1,
              pageSize: 20,
              total: model.emptyBatches ? 0 : 1,
            };
    else if (endpoint.endsWith(`/batches/${batch.id}`)) data = batch;
    else if (endpoint.endsWith(`/batches/${batch.id}/submissions`)) {
      model.submission.declared = body.declared;
      model.submission.externalRef = body.externalRef;
      const replacement =
        model.submission.state === 'expired' ||
        body.parts.length !== model.submission.parts.length ||
        body.parts.some(
          (part, index) =>
            part.fileName !== model.submission.parts[index]?.fileName ||
            part.byteSize !== model.submission.parts[index]?.byteSize
        );
      model.submission.parts = body.parts.map((part, index) => ({
        ...initialSubmission().parts[0],
        ...model.submission.parts[index],
        ...part,
        ...(replacement ? { uploadState: 'pending', completedAt: null } : {}),
        id: `part-${index}`,
        claruPartId: `remote-${index}`,
      }));
      if (model.submission.state === 'expired' || model.submission.state === 'refused')
        model.submission.state = 'draft';
      data = {
        submission: model.submission,
        uploadInstructions: model.submission.parts.map((part) => ({
          localPartId: part.id,
          claruPartId: part.claruPartId,
          fileType: part.fileType,
          fileName: part.fileName,
          byteSize: part.byteSize,
          uploadState: part.uploadState,
          upload:
            part.uploadState === 'uploaded'
              ? null
              : {
                  kind: 'put',
                  url: `https://claru-test.s3.amazonaws.com/${part.id}`,
                  headers: {
                    'x-amz-meta-source': 'supplier_upload',
                    ...(part.fileType === 'video' ? { 'content-type': 'video/mp4' } : {}),
                  },
                  expiresAt: now,
                },
        })),
      };
    } else if (endpoint.endsWith('/claru/submissions'))
      data = { items: [model.submission], page: 1, pageSize: 20, total: 1 };
    else if (endpoint.endsWith('/complete')) {
      const partId = endpoint.split('/').at(-2);
      const part = model.submission.parts.find((item) => item.id === partId);
      assert.ok(part, 'complete matches the declared part');
      part.uploadState = 'uploaded';
      part.completedAt = now;
      data = model.submission;
    } else if (endpoint.endsWith('/seal')) {
      if (model.sealRefusal) {
        model.submission.state = 'refused';
        model.submission.lastRefusal = {
          code: 'VIDEO_CHECKS_FAILED',
          message: 'Footage checks failed',
          details: {
            remedy: 'Replace the affected footage.',
            refusals: [{ code: 'FROZEN', remedy: 'Check the camera and re-record.' }],
          },
          at: now,
        };
        return route.fulfill({
          status: 422,
          json: {
            success: false,
            error: { code: 'VIDEO_CHECKS_FAILED', message: 'Footage checks failed' },
          },
        });
      }
      model.submission.state = 'processing';
      model.submission.sealed = true;
      model.submission.sealedAt = now;
      data = model.submission;
    } else if (endpoint.includes('/claru/submissions/')) data = model.submission;
    else data = {};
    await route.fulfill({ json: { success: true, data } });
  });
  await context.route('https://claru-test.s3.amazonaws.com/**', async (route) => {
    model.storage.push({
      method: route.request().method(),
      headers: route.request().headers(),
      bytes: route.request().postDataBuffer()?.length,
    });
    if (model.pauseStorage)
      await new Promise((resolve) => {
        model.releaseStorage = resolve;
      });
    if (model.storageFailure) return route.fulfill({ status: 403, body: 'Expired signature' });
    await route.fulfill({
      status: 200,
      headers: { ETag: '"test-etag"', 'access-control-allow-origin': '*' },
      body: '',
    });
  });
  try {
    await run(page, model);
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    results.push({ name, result: 'PASS' });
    console.log(`PASS ${name}`);
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true });
    console.error((await page.locator('body').innerText()).slice(-5000));
    throw new Error(`${name}: ${error.message}`, { cause: error });
  } finally {
    await context.close();
  }
}

async function ready(page, route = `/dashboard/claru/submissions/submission-review`) {
  await page.goto(base + route);
  await page.locator('h1').waitFor();
}
async function visible(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor();
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    `${name} has no horizontal page overflow`
  );
}
async function resume(page) {
  await page.getByRole('button', { name: 'Resume upload', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'capture.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(12, 1) });
  await page.locator('form button[type=submit]').click();
  await page.getByRole('button', { name: 'Start upload', exact: true }).waitFor();
}

(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  browser = await chromium.launch({ headless: true });
  await scenario('create batch validates and saves capture defaults', async (page, model) => {
    await ready(page, '/dashboard/claru');
    await page.getByRole('button', { name: 'New delivery batch', exact: true }).click();
    await page.locator('form button[type=submit]').click();
    await visible(page, 'Enter a clear batch name.');
    await page.getByLabel('Batch name', { exact: true }).fill('New delivery review');
    await page.getByLabel('Country code', { exact: true }).fill('in');
    await page.getByLabel('Collector ID', { exact: true }).fill('COL-007');
    await page.locator('form button[type=submit]').click();
    await page.waitForURL(`**/batches/${batch.id}`);
    const create = model.requests.find(
      (request) => request.endpoint.endsWith('/claru/batches') && request.method === 'POST'
    );
    assert.equal(create.body.name, 'New delivery review');
    assert.equal(create.body.projectId, project.id);
    assert.equal(create.body.defaults.country, 'IN');
    assert.equal(create.body.defaults.collectorId, 'COL-007');
  });
  await scenario('create, searchable categories, upload, and seal', async (page, model) => {
    await ready(page, `/dashboard/claru/batches/${batch.id}`);
    await screenshot(page, 'batch-desktop');
    await page.getByRole('button', { name: 'Add clip', exact: true }).click();
    await page.getByLabel('External reference', { exact: true }).fill('kitchen-new-0042');
    await page.locator('#claru-category').click();
    const search = page.getByRole('combobox', { name: 'Search activity categories' });
    await search.fill('vegetables');
    await page.getByRole('option', { name: /Preparing vegetables/ }).waitFor();
    await search.press('Enter');
    await page.getByLabel('Duration in minutes', { exact: true }).fill('10.056666666666667');
    await page
      .locator('#claru-file-video')
      .setInputFiles({ name: 'capture.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(12, 1) });
    await page
      .locator('#claru-file-other')
      .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') });
    await screenshot(page, 'create-dialog-desktop');
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
    await page.locator('form button[type=submit]').click();
    await page.getByRole('button', { name: 'Start upload', exact: true }).waitFor();
    assert.equal(model.submission.declared.categoryCode, 'ACT-219');
    assert.equal(model.submission.declared.durationSeconds, 603.4);
    await screenshot(page, 'upload-ready-desktop');
    await page.getByRole('button', { name: 'Start upload', exact: true }).click();
    await page.getByRole('button', { name: 'Seal submission', exact: true }).waitFor();
    assert.equal(model.storage.length, 2);
    assert.equal(model.storage[0].headers['x-amz-meta-source'], 'supplier_upload');
    assert.equal(model.storage[0].headers['content-type'], 'video/mp4');
    assert.equal(model.storage[0].bytes, 12);
    assert.equal(
      model.storage[1].headers['content-type'],
      undefined,
      'no invented sidecar Content-Type'
    );
    await page.getByRole('button', { name: 'Seal submission', exact: true }).click();
    await page.getByRole('button', { name: 'Seal and submit', exact: true }).click();
    await visible(page, 'Claru is processing or reviewing this clip');
    assert.equal(model.submission.sealed, true);
    assert.equal(
      await page.getByRole('button', { name: 'Seal submission', exact: true }).count(),
      0
    );
    await screenshot(page, 'processing-desktop');
  });
  for (const durationMinutes of [2, 40]) {
    await scenario(
      `create preserves ${durationMinutes}-minute declaration outside the project media range`,
      async (page, model) => {
        await ready(page, `/dashboard/claru/batches/${batch.id}`);
        await page.getByRole('button', { name: 'Add clip', exact: true }).click();
        await page.getByLabel('External reference', { exact: true }).fill('duration-create-review');
        await page.locator('#claru-category').click();
        const search = page.getByRole('combobox', { name: 'Search activity categories' });
        await search.fill('vegetables');
        await page.getByRole('option', { name: /Preparing vegetables/ }).click();
        const duration = page.getByLabel('Duration in minutes', { exact: true });
        await duration.fill(String(durationMinutes));
        assert.equal(await duration.evaluate((input) => input.validity.valid), true);
        await visible(page, 'Claru checks the actual file');
        await page.locator('#claru-file-video').setInputFiles({
          name: 'capture.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.alloc(12, 1),
        });
        for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
        await page.locator('form button[type=submit]').click();
        await page.getByRole('button', { name: 'Start upload', exact: true }).waitFor();
        const request = model.requests.find((entry) =>
          entry.endpoint.endsWith(`/batches/${batch.id}/submissions`)
        );
        assert.equal(request.body.declared.durationSeconds, durationMinutes * 60);
        assert.equal(model.submission.declared.durationSeconds, durationMinutes * 60);
        assert.equal(model.submission.state, 'draft');
        assert.equal(model.submission.sealed, false);
        assert.equal(model.requests.filter((entry) => entry.endpoint.endsWith('/seal')).length, 0);
      }
    );
    await scenario(
      `correction preserves ${durationMinutes}-minute declaration outside the project media range`,
      async (page, model) => {
        model.submission.parts[0].uploadState = 'uploaded';
        await ready(page);
        await page.getByRole('button', { name: 'Correct submission', exact: true }).click();
        await page.getByRole('radio', { name: /Declaration only/ }).click();
        const duration = page.getByLabel('Duration in minutes', { exact: true });
        await duration.fill(String(durationMinutes));
        assert.equal(await duration.evaluate((input) => input.validity.valid), true);
        await visible(page, 'Claru checks the actual file');
        await page.getByRole('button', { name: 'Save declaration', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        const request = model.requests.find((entry) =>
          entry.endpoint.endsWith(`/batches/${batch.id}/submissions`)
        );
        assert.equal(request.body.declared.durationSeconds, durationMinutes * 60);
        assert.equal(model.submission.declared.durationSeconds, durationMinutes * 60);
        assert.equal(model.submission.state, 'draft');
        assert.equal(model.submission.sealed, false);
        assert.equal(model.storage.length, 0);
        assert.equal(model.requests.filter((entry) => entry.endpoint.endsWith('/seal')).length, 0);
      }
    );
  }
  await scenario(
    'resume after storage failure retains reference and retries',
    async (page, model) => {
      model.storageFailure = true;
      await ready(page);
      await resume(page);
      await page.getByRole('button', { name: 'Start upload', exact: true }).click();
      await visible(page, 'Upload needs attention');
      assert.equal(model.requests.filter((r) => r.endpoint.endsWith('/complete')).length, 0);
      model.storageFailure = false;
      await page.getByRole('button', { name: 'Retry upload', exact: true }).click();
      await page.getByRole('button', { name: 'Seal submission', exact: true }).waitFor();
      assert.ok(
        model.requests
          .filter((r) => r.endpoint.endsWith('/submissions') && r.body)
          .every((r) => r.body.externalRef === 'kitchen-2026-09-27-0031')
      );
    }
  );
  await scenario(
    'read-only and denied permissions',
    async (page) => {
      await ready(page);
      assert.equal(
        await page.getByRole('button', { name: /Resume upload|Seal submission/ }).count(),
        0
      );
      await ready(page, '/dashboard/claru');
      assert.equal(
        await page.getByRole('button', { name: 'New delivery batch', exact: true }).count(),
        0
      );
    },
    { userType: 'ADMIN', permissions: ['VIEW_CLARU_DELIVERIES'] }
  );
  await scenario(
    'unassigned admin cannot enter deliveries',
    async (page, model) => {
      await page.goto(base + '/dashboard/claru');
      await visible(page, 'Access restricted');
      assert.equal(model.requests.filter((r) => r.endpoint.includes('/claru/')).length, 0);
    },
    { userType: 'ADMIN', permissions: [] }
  );
  await scenario(
    'blocked team cannot mutate',
    async (page) => {
      await ready(page);
      await visible(page, 'Contact Claru to restore team access.');
      assert.equal(
        await page.getByRole('button', { name: /Resume upload|Seal submission/ }).count(),
        0
      );
    },
    { blocked: true }
  );
  await scenario('mobile, tablet, dark mode, and category search', async (page) => {
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await ready(page, '/dashboard/claru');
      await screenshot(page, `overview-${width}`);
      await ready(page, `/dashboard/claru/batches/${batch.id}`);
      await screenshot(page, `batch-${width}`);
      await page.getByRole('button', { name: 'Add clip', exact: true }).click();
      await page.locator('#claru-category').click();
      await page.getByRole('combobox', { name: 'Search activity categories' }).fill('vegetables');
      await screenshot(page, `category-${width}`);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await ready(page);
      await screenshot(page, `detail-${width}`);
    }
    await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await screenshot(page, 'detail-dark');
  });
  await scenario('seal refusal shows remedies and replacement consent', async (page, model) => {
    model.submission.parts[0].uploadState = 'uploaded';
    model.sealRefusal = true;
    await ready(page);
    await page.getByRole('button', { name: 'Seal submission', exact: true }).click();
    await page.getByRole('button', { name: 'Seal and submit', exact: true }).click();
    await visible(page, 'Check the camera and re-record.');
    await screenshot(page, 'seal-refused');
    await page.getByRole('button', { name: 'Correct submission', exact: true }).click();
    assert.equal(await page.getByRole('checkbox').count(), 4);
    for (const checkbox of await page.getByRole('checkbox').all())
      assert.equal(await checkbox.isChecked(), false);
    await page.locator('input[id^=claru-resume-]').setInputFiles({
      name: 'replacement.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.alloc(13, 2),
    });
    await page.locator('form button[type=submit]').click();
    await visible(page, 'Confirm all four');
    assert.equal(
      model.requests.filter((r) => r.endpoint.endsWith(`/batches/${batch.id}/submissions`)).length,
      0
    );
    await page.locator('#claru-extra-other').setInputFiles({
      name: 'capture-notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('capture notes'),
    });
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
    await page.locator('form button[type=submit]').click();
    await page.getByRole('button', { name: 'Start upload', exact: true }).waitFor();
    assert.equal(model.submission.parts.length, 2);
    assert.equal(model.submission.parts[1].fileType, 'other');
    await page.getByRole('button', { name: 'Start upload', exact: true }).click();
    await page.getByRole('button', { name: 'Seal submission', exact: true }).waitFor();
  });
  await scenario('pause and resume does not complete an aborted PUT', async (page, model) => {
    model.pauseStorage = true;
    await ready(page);
    await resume(page);
    await Promise.all([
      page.waitForRequest((request) =>
        request.url().startsWith('https://claru-test.s3.amazonaws.com/')
      ),
      page.getByRole('button', { name: 'Start upload', exact: true }).click(),
    ]);
    await page.getByRole('button', { name: 'Pause upload', exact: true }).click();
    await visible(page, 'Upload paused');
    assert.equal(model.requests.filter((r) => r.endpoint.endsWith('/complete')).length, 0);
    model.pauseStorage = false;
    model.releaseStorage();
    await page.getByRole('button', { name: 'Resume upload', exact: true }).click();
    await page.getByRole('button', { name: 'Seal submission', exact: true }).waitFor();
    assert.equal(model.requests.filter((r) => r.endpoint.endsWith('/complete')).length, 1);
  });
  await scenario(
    'declaration correction preserves exact timestamps and duration',
    async (page, model) => {
      model.submission.parts[0].uploadState = 'uploaded';
      model.submission.declared.recordedAt = '2026-09-27T05:32:11.123+05:30';
      model.submission.declared.durationSeconds = 603.41234;
      await ready(page);
      await page.getByRole('button', { name: 'Correct submission', exact: true }).click();
      await page.getByRole('radio', { name: /Declaration only/ }).click();
      await page.getByLabel('Device', { exact: true }).fill('GoPro HERO13');
      await page.getByRole('button', { name: 'Save declaration', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      assert.equal(model.submission.declared.recordedAt, '2026-09-27T05:32:11.123+05:30');
      assert.equal(model.submission.declared.durationSeconds, 603.41234);
      assert.equal(model.submission.declared.device, 'GoPro HERO13');
      assert.equal(model.storage.length, 0);
    }
  );
  await scenario(
    'manage permission does not grant seal permission',
    async (page, model) => {
      model.submission.parts[0].uploadState = 'uploaded';
      await ready(page);
      await page.getByRole('button', { name: 'Correct submission', exact: true }).waitFor();
      assert.equal(
        await page.getByRole('button', { name: 'Seal submission', exact: true }).count(),
        0
      );
    },
    { userType: 'ADMIN', permissions: ['MANAGE_CLARU_DELIVERIES'] }
  );
  await scenario(
    'seal permission does not grant upload permission',
    async (page, model) => {
      model.submission.parts[0].uploadState = 'uploaded';
      await ready(page);
      await page.getByRole('button', { name: 'Seal submission', exact: true }).waitFor();
      assert.equal(
        await page.getByRole('button', { name: 'Correct submission', exact: true }).count(),
        0
      );
    },
    { userType: 'ADMIN', permissions: ['SEAL_CLARU_DELIVERIES'] }
  );
  await scenario(
    'discovery failure remains actionable',
    async (page) => {
      await ready(page, '/dashboard/claru');
      await visible(page, 'Claru connection unavailable');
      await page.getByRole('button', { name: 'Refresh projects', exact: true }).waitFor();
      await visible(page, batch.name);
    },
    { discoveryError: true }
  );
  await fs.writeFile(path.join(artifacts, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length} browser scenarios passed. Artifacts: ${artifacts}`);
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
