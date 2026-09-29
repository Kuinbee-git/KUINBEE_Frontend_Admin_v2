/* Real localhost HTTP/CORS regression; API/storage fixtures are not live Claru. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import ts from 'typescript';
import { chromium } from 'playwright';

const fixture = Buffer.from('ABCDEFGHIJKLMNOPQR');
const generation = '0d22c52e-418d-4d7a-94c9-7756eeb85b07';
const session = 'relay-regression-session';
const model = {
  storage: [],
  options: [],
  relays: [],
  checkpoints: [],
  completes: [],
  holds: [],
  abortedRelays: 0,
  activeRelays: 0,
  maxActiveRelays: 0,
  allowStorageCors: false,
  holdStorage: false,
};
let appOrigin;
let apiOrigin;
let storageOrigin;
let browser;
let currentStage;

const json = (response, status, data) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
};
const body = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
};
const listen = async (server) => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
};
const authenticated = (request) =>
  request.headers.cookie?.split(/;\s*/).includes(`relay_session=${session}`);

const storageServer = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    model.options.push(request.headers.origin);
    if (!model.allowStorageCors) return response.writeHead(403).end();
    response.writeHead(204, {
      'Access-Control-Allow-Origin': appOrigin,
      'Access-Control-Allow-Methods': 'PUT',
      'Access-Control-Allow-Headers': 'content-type,x-amz-meta-source',
    });
    return response.end();
  }
  if (request.method !== 'PUT') return response.writeHead(405).end();
  const bytes = await body(request);
  const partNumber = Number(new URL(request.url, storageOrigin).searchParams.get('partNumber'));
  model.storage.push({ partNumber, bytes, headers: request.headers });
  const finish = () => {
    if (response.destroyed) return;
    const headers = { ETag: `"etag-${partNumber || 'put'}"` };
    if (model.allowStorageCors) {
      headers['Access-Control-Allow-Origin'] = appOrigin;
      headers['Access-Control-Expose-Headers'] = 'ETag';
    }
    response.writeHead(200, headers).end();
  };
  if (model.holdStorage) model.holds.push(finish);
  else finish();
});

// Authenticated fixture forwards the request stream to its own storage target.
// Tests exercise real cookies/preflights/XHR aborts; production backend security
// and validation are covered by the separate backend relay suite.
const apiServer = http.createServer(async (request, response) => {
  if (request.headers.origin) {
    if (request.headers.origin !== appOrigin) return json(response, 403, { success: false });
    response.setHeader('Access-Control-Allow-Origin', appOrigin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Methods', 'POST,PUT,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (request.method === 'OPTIONS') return response.writeHead(204).end();
  if (!authenticated(request))
    return json(response, 401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Test relay requires its session cookie' },
    });
  const url = new URL(request.url, apiOrigin);
  if (url.pathname.endsWith('/upload')) {
    if (request.method !== 'PUT' || url.searchParams.get('generation') !== generation)
      return json(response, 400, { success: false });
    const partNumber = Number(url.searchParams.get('partNumber'));
    if (partNumber < 1 || partNumber > 5) return json(response, 400, { success: false });
    const expected = Math.min(4, fixture.length - (partNumber - 1) * 4);
    if (Number(request.headers['content-length']) !== expected)
      return json(response, 400, { success: false });
    model.relays.push({ partNumber, headers: request.headers });
    model.activeRelays++;
    model.maxActiveRelays = Math.max(model.maxActiveRelays, model.activeRelays);
    const upstream = http.request(
      `${storageOrigin}/signed-fixture?partNumber=${partNumber}`,
      { method: 'PUT', headers: { 'Content-Length': expected } },
      (upstreamResponse) => {
        upstreamResponse.resume();
        upstreamResponse.on('end', () => {
          if (!response.destroyed)
            json(response, 200, {
              success: true,
              data: { etag: upstreamResponse.headers.etag },
            });
        });
      }
    );
    upstream.on('error', () => {
      if (!response.destroyed) json(response, 502, { success: false });
    });
    response.on('close', () => {
      model.activeRelays--;
      if (!response.writableEnded) {
        model.abortedRelays++;
        upstream.destroy();
      }
    });
    request.on('aborted', () => upstream.destroy());
    request.pipe(upstream);
    return;
  }
  if (url.pathname.endsWith('/checkpoint')) {
    const input = JSON.parse((await body(request)).toString());
    model.checkpoints.push(input);
    return json(response, 200, { success: true, data: currentStage.submission.parts[0] });
  }
  if (url.pathname.endsWith('/complete')) {
    model.completes.push(JSON.parse((await body(request)).toString()));
    return json(response, 200, {
      success: true,
      data: {
        ...currentStage.submission,
        parts: currentStage.submission.parts.map((part) => ({ ...part, uploadState: 'uploaded' })),
      },
    });
  }
  return json(response, 404, { success: false });
});

const compiled = async (relativePath) =>
  ts.transpileModule(await fs.readFile(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const moduleScript = (name, code) => `
  (function () {
    const exports = {};
    const require = (id) => {
      if (!(id in modules)) throw new Error('Unexpected test module: ' + id);
      return modules[id];
    };
    ${code}
    modules[${JSON.stringify(name)}] = exports;
  })();`;
let appHtml;
const appServer = http.createServer((_request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Security-Policy': `default-src 'self'; script-src 'nonce-relay-regression'; connect-src 'self' ${apiOrigin} ${storageOrigin}`,
  });
  response.end(appHtml);
});

const stage = ({ relay = false, uploadedParts = [], single = false } = {}) => {
  const upload = single
    ? {
        kind: 'put',
        url: `${storageOrigin}/signed-fixture`,
        headers: { 'content-type': 'video/mp4', 'x-amz-meta-source': 'supplier_upload' },
      }
    : {
        kind: 'multipart',
        uploadId: 'upload-generation-1',
        partSizeBytes: 4,
        parts: [1, 2, 3, 4, 5].map((partNumber) => ({
          partNumber,
          url: `${storageOrigin}/signed-fixture?partNumber=${partNumber}`,
        })),
        headers: {},
      };
  return {
    submission: {
      id: 'submission',
      sealed: false,
      parts: [
        {
          id: 'part',
          clientPartId: 'client-part',
          fileName: 'clip.mp4',
          byteSize: String(fixture.length),
          uploadState: 'pending',
          uploadedParts,
        },
      ],
    },
    uploadInstructions: [
      {
        localPartId: 'part',
        uploadState: 'pending',
        upload,
        ...(relay ? { relay: { generation, expiresAt: '2099-01-01T00:00:00.000Z' } } : {}),
      },
    ],
  };
};

async function runUpload(page, staged) {
  currentStage = staged;
  await page.evaluate(
    ({ staged, bytes }) => {
      window.uploadResult = undefined;
      window.uploadProgress = [];
      window.uploadController = new AbortController();
      const file = new File([Uint8Array.from(bytes)], 'clip.mp4', { type: 'video/mp4' });
      window.uploadPromise = window.uploadEngine
        .uploadClaruSubmissionFiles({
          staged,
          filesByPartId: { part: file },
          signal: window.uploadController.signal,
          onProgress: (value) => window.uploadProgress.push(value),
        })
        .then(
          (submission) => {
            window.uploadResult = { ok: true, submission };
          },
          (error) => {
            window.uploadResult = {
              ok: false,
              message: error.message,
              statusCode: error.statusCode,
            };
          }
        );
    },
    { staged, bytes: [...fixture] }
  );
}
async function result(page) {
  await page.waitForFunction(() => window.uploadResult !== undefined);
  return page.evaluate(() => window.uploadResult);
}
async function waitFor(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail(message);
}
const releaseStorage = () => {
  model.holdStorage = false;
  model.holds.splice(0).forEach((finish) => finish());
};

async function scenario(name, run, { cookie = true } = {}) {
  model.storage = [];
  model.options = [];
  model.relays = [];
  model.checkpoints = [];
  model.completes = [];
  model.abortedRelays = 0;
  model.activeRelays = 0;
  model.maxActiveRelays = 0;
  model.allowStorageCors = false;
  model.holdStorage = false;
  const context = await browser.newContext();
  if (cookie)
    await context.addCookies([
      {
        name: 'relay_session',
        value: session,
        url: apiOrigin,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(appOrigin);
  try {
    await run(page);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}`);
  } finally {
    releaseStorage();
    await context.close();
    await waitFor(
      () => model.activeRelays === 0,
      'relay connections close before the next scenario'
    );
  }
}

try {
  storageOrigin = await listen(storageServer);
  apiOrigin = await listen(apiServer);
  appOrigin = await listen(appServer);
  const modules = await Promise.all([
    compiled('../src/lib/constants/api-routes.ts'),
    compiled('../src/lib/api/client.ts'),
    compiled('../src/services/claru.service.ts'),
    compiled('../src/services/claru-upload.service.ts'),
  ]);
  appHtml = `<!DOCTYPE html><title>Claru relay HTTP regression</title><script nonce="relay-regression">
    (function () {
      const process = { env: { NEXT_PUBLIC_API_URL: ${JSON.stringify(`${apiOrigin}/api`)}, NEXT_PUBLIC_UPLOAD_TIMEOUT_MS: '5000' } };
      const modules = { '@/lib/utils/service.utils': { buildQueryString: () => '' } };
      ${moduleScript('@/lib/constants/api-routes', modules[0])}
      ${moduleScript('@/lib/api/client', modules[1])}
      ${moduleScript('./claru.service', modules[2])}
      ${moduleScript('./claru-upload.service', modules[3])}
      window.uploadEngine = modules['./claru-upload.service'];
      window.sessionExpiryEvents = 0;
      window.addEventListener(modules['@/lib/api/client'].SESSION_EXPIRED_EVENT, () => { window.sessionExpiryEvents++; });
    })();
  </script>`;
  browser = await chromium.launch({ headless: true });

  await scenario(
    'real storage preflight denial prevents direct upload and completion',
    async (page) => {
      await runUpload(page, stage());
      const outcome = await result(page);
      assert.equal(outcome.ok, false);
      assert.match(outcome.message, /browser could not reach|network|storage/i);
      assert.ok(model.options.length > 0, 'browser issued real cross-origin OPTIONS');
      assert.equal(model.storage.length, 0, 'CORS-blocked browser never sent the PUT body');
      assert.equal(model.checkpoints.length, 0);
      assert.equal(model.completes.length, 0);
    }
  );

  await scenario(
    'advertised authenticated relay uploads exact slices with four workers',
    async (page) => {
      model.holdStorage = true;
      await runUpload(page, stage({ relay: true }));
      await waitFor(() => model.storage.length === 4, 'four relay slices reach storage');
      assert.equal(model.maxActiveRelays, 4);
      assert.equal(model.relays.length, 4, 'fifth slice waits for one worker');
      releaseStorage();
      const outcome = await result(page);
      assert.equal(outcome.ok, true, outcome.message);
      assert.equal(
        model.options.length,
        0,
        'relay does not issue browser preflights to vendor storage'
      );
      assert.deepEqual(
        model.storage.map((item) => item.partNumber).sort((a, b) => a - b),
        [1, 2, 3, 4, 5]
      );
      for (const item of model.storage) {
        assert.deepEqual(
          item.bytes,
          fixture.subarray((item.partNumber - 1) * 4, item.partNumber * 4)
        );
        assert.equal(item.headers.cookie, undefined, 'API session is never forwarded to storage');
        assert.equal(
          item.headers['content-type'],
          undefined,
          'multipart storage headers remain bare'
        );
      }
      assert.ok(model.relays.every((item) => authenticated({ headers: item.headers })));
      assert.ok(
        model.relays.every((item) => item.headers['content-type'] === 'application/octet-stream')
      );
      assert.equal(model.checkpoints.length, 5);
      assert.ok(model.checkpoints.every((item) => item.uploadId === 'upload-generation-1'));
      assert.ok(model.checkpoints.every((item) => item.etag === `"etag-${item.partNumber}"`));
      assert.equal(model.completes.length, 1);
      const progress = await page.evaluate(() => window.uploadProgress);
      assert.ok(progress.some((item) => item.uploadedBytes > 0));
      assert.equal(progress.at(-1).phase, 'completed');
      assert.equal(progress.at(-1).uploadedBytes, fixture.length);
    }
  );

  await scenario(
    'relay resume reuses the upload generation and skips saved slices',
    async (page) => {
      await runUpload(
        page,
        stage({ relay: true, uploadedParts: [{ partNumber: 2, etag: '"saved-2"' }] })
      );
      assert.equal((await result(page)).ok, true);
      assert.deepEqual(
        model.storage.map((item) => item.partNumber).sort((a, b) => a - b),
        [1, 3, 4, 5]
      );
      assert.equal(model.checkpoints.length, 4);
      assert.equal(model.completes.length, 1);
    }
  );

  await scenario(
    'pause aborts upstream relays without checkpoint or completion, then resumes',
    async (page) => {
      model.holdStorage = true;
      await runUpload(page, stage({ relay: true }));
      await waitFor(() => model.storage.length === 4, 'four storage responses are held');
      await page.evaluate(() => window.uploadController.abort());
      const paused = await result(page);
      assert.equal(paused.ok, false);
      assert.match(paused.message, /paused/i);
      await waitFor(
        () => model.abortedRelays === 4,
        'browser abort closes upstream relay connections'
      );
      assert.equal(model.checkpoints.length, 0);
      assert.equal(model.completes.length, 0);
      releaseStorage();
      model.storage = [];
      model.relays = [];
      await runUpload(page, stage({ relay: true }));
      assert.equal((await result(page)).ok, true);
      assert.equal(model.storage.length, 5);
      assert.equal(model.checkpoints.length, 5);
      assert.equal(model.completes.length, 1);
    }
  );

  await scenario(
    'missing session cookie rejects relay and signals session expiry',
    async (page) => {
      await runUpload(page, stage({ relay: true }));
      const outcome = await result(page);
      assert.equal(outcome.ok, false);
      assert.equal(outcome.statusCode, 401);
      assert.ok(await page.evaluate(() => window.sessionExpiryEvents > 0));
      assert.equal(model.storage.length, 0);
      assert.equal(model.checkpoints.length, 0);
      assert.equal(model.completes.length, 0);
    },
    { cookie: false }
  );

  await scenario(
    'instructions without relay retain direct exact-header upload support',
    async (page) => {
      model.allowStorageCors = true;
      await runUpload(page, stage({ single: true }));
      const outcome = await result(page);
      assert.equal(outcome.ok, true, outcome.message);
      assert.equal(model.relays.length, 0);
      assert.equal(model.storage.length, 1);
      assert.deepEqual(model.storage[0].bytes, fixture);
      assert.equal(model.storage[0].headers['content-type'], 'video/mp4');
      assert.equal(model.storage[0].headers['x-amz-meta-source'], 'supplier_upload');
      assert.equal(
        model.storage[0].headers.cookie,
        undefined,
        'direct cross-origin storage is credential-free'
      );
      assert.equal(model.completes.length, 1);
    }
  );
  console.log('6 real HTTP browser relay scenarios passed; no live Claru requests or media seals.');
} finally {
  releaseStorage();
  await browser?.close();
  for (const server of [appServer, apiServer, storageServer]) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
