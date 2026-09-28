import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { File } from 'node:buffer';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { create } = require('zustand');
const user = { id: 'admin-a', userType: 'SUPERADMIN' };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const until = async (condition) => {
  for (let tick = 0; tick < 100; tick += 1) {
    if (condition()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail('Queue did not reach the expected state');
};

// Execute the actual store and scheduler. Mock only network/storage transfers,
// allowing assertions on race boundaries, ownership, persistence, and retries.
function harness({
  onCreate,
  onUpload,
  savedStorage,
  initialUser = user,
  initialPermissions = [],
} = {}) {
  const storage = savedStorage ?? new Map();
  const auth = create(() => ({ user: initialUser, permissions: initialPermissions }));
  const singles = create(() => ({
    pendingBySubmissionId: {},
    clearUpload: (id) =>
      singles.setState((state) => {
        const pendingBySubmissionId = { ...state.pendingBySubmissionId };
        delete pendingBySubmissionId[id];
        return { pendingBySubmissionId };
      }),
  }));
  const active = new Map();
  const creates = [],
    uploads = [];
  let counter = 0;
  const source = (name, deps) => {
    const exports = {};
    const code = ts.transpileModule(
      fs.readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
    ).outputText;
    vm.runInNewContext(code, {
      exports,
      require: (path) => {
        if (!(path in deps)) throw new Error(`Unexpected dependency ${path}`);
        return deps[path];
      },
      window: {
        sessionStorage: {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, value),
          removeItem: (key) => storage.delete(key),
        },
      },
      crypto: { randomUUID: () => `queue-${++counter}` },
      AbortController,
      queueMicrotask,
      Date,
      Set,
      Map,
      Error,
    });
    return exports;
  };
  const store = source('store/claru-queue.store.ts', { zustand: { create } }).useClaruQueueStore;
  const resultFor = (input) => ({
    submission: {
      id: `submission-${input.externalRef}`,
      batchId: input.batchId,
      externalRef: input.externalRef,
      declared: input.declared,
      state: 'draft',
      sealed: false,
      parts: input.parts.map((part) => ({
        ...part,
        id: `part-${input.externalRef}-${part.clientPartId}`,
        uploadState: 'pending',
      })),
    },
    uploadInstructions: input.parts.map((part) => ({
      localPartId: `part-${input.externalRef}-${part.clientPartId}`,
      uploadState: 'pending',
      upload: { kind: 'put', url: `https://storage.invalid/private-signed-${creates.length}` },
    })),
  });
  const api = source('services/claru-queue.service.ts', {
    '@/store/auth.store': { useAuthStore: auth },
    '@/store/claru-upload.store': { activeClaruTransfers: active, useClaruUploadStore: singles },
    '@/store/claru-queue.store': { useClaruQueueStore: store },
    '@/lib/utils/error.utils': { getFriendlyErrorMessage: (error) => error.message },
    './claru.service': {
      createClaruSubmission: async (input, { signal }) => {
        creates.push({ input, signal });
        return onCreate ? onCreate(input, signal, resultFor(input)) : resultFor(input);
      },
    },
    './claru-upload.service': {
      uploadClaruSubmissionFiles: async (args) => {
        uploads.push(args);
        await onUpload?.(args);
        const submission = {
          ...args.staged.submission,
          parts: args.staged.submission.parts.map((part) => ({ ...part, uploadState: 'uploaded' })),
        };
        submission.parts.forEach((part) =>
          args.onProgress({
            partId: part.id,
            fileName: part.fileName,
            uploadedBytes: Number(part.byteSize),
            totalBytes: Number(part.byteSize),
            phase: 'completed',
          })
        );
        return submission;
      },
    },
  });
  const entry = (externalRef) => {
    const file = new File(['original-media'], `${externalRef}.mp4`, { type: 'video/mp4' });
    return {
      input: {
        batchId: 'batch-1',
        externalRef,
        declared: {
          country: 'IN',
          collectorId: 'collector',
          siteId: 'site',
          device: 'camera',
          mount: 'head',
          recordedAt: '2026-09-28T06:00:00.000Z',
          durationSeconds: 600,
          consent: {
            worker_consent_obtained: true,
            site_or_employer_permission_obtained: true,
            required_consent_or_notice_process_followed: true,
            footage_unedited: true,
          },
        },
        parts: [
          {
            clientPartId: 'video',
            fileType: 'video',
            fileName: file.name,
            byteSize: String(file.size),
          },
        ],
      },
      filesByClientPartId: { video: file },
    };
  };
  return { api, store, auth, singles, active, storage, creates, uploads, entry, resultFor };
}

test('clips run one at a time and continue after a failed clip without sealing', async () => {
  const blocks = [deferred(), deferred(), deferred()];
  let cursor = 0;
  const h = harness({ onUpload: () => blocks[cursor++].promise });
  const ids = h.api.enqueueClaruClips(['one', 'two', 'three'].map(h.entry));
  h.api.startClaruQueue();
  await until(() => h.uploads.length === 1);
  assert.equal(h.creates.length, 1);
  blocks[0].resolve();
  await until(() => h.uploads.length === 2);
  blocks[1].reject(new Error('Storage rejected status 403'));
  await until(() => h.uploads.length === 3);
  blocks[2].resolve();
  await until(() => h.store.getState().items[2].status === 'ready');
  assert.deepEqual(
    Array.from(h.store.getState().items, (item) => item.status),
    ['ready', 'failed', 'ready']
  );
  assert.equal(h.store.getState().items[1].id, ids[1]);
  assert.equal(h.active.size, 0);
  assert.equal(Object.keys(h.store.getState().items[0].filesByClientPartId).length, 0);
});

test('retry requests fresh instructions using the exact same reference and only retries the failed clip', async () => {
  let fail = true;
  const h = harness({
    onUpload: () => {
      if (fail) {
        fail = false;
        throw new Error('signed URL expired');
      }
    },
  });
  const [id] = h.api.enqueueClaruClips([h.entry('one')]);
  h.api.startClaruQueue();
  await until(() => h.store.getState().items[0].status === 'failed');
  h.api.retryClaruQueueItem(id);
  await until(() => h.store.getState().items[0].status === 'ready');
  assert.equal(h.creates.length, 2);
  assert.equal(h.creates[0].input.externalRef, h.creates[1].input.externalRef);
  assert.notEqual(
    h.uploads[0].staged.uploadInstructions[0].upload.url,
    h.uploads[1].staged.uploadInstructions[0].upload.url
  );
  h.api.startClaruQueue();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.creates.length, 2, 'ready clips must never be resubmitted');
});

test('pause retains locks until checkpoint drain and prevents the next queued clip from starting', async () => {
  const drain = deferred();
  const h = harness({
    onUpload: async ({ signal }) => {
      await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }));
      await drain.promise;
      throw new Error('paused');
    },
  });
  const [id] = h.api.enqueueClaruClips([h.entry('one'), h.entry('two')]);
  h.api.startClaruQueue();
  await until(() => h.uploads.length === 1);
  h.api.pauseClaruQueue();
  assert.deepEqual(
    Array.from(h.store.getState().items, (item) => item.status),
    ['pausing', 'paused']
  );
  assert.ok(h.active.size >= 2);
  assert.throws(() => h.api.resumeClaruQueueItem(id), /last checkpoint/);
  drain.resolve();
  await until(() => h.store.getState().items[0].status === 'paused');
  assert.equal(h.active.size, 0);
  assert.equal(h.creates.length, 1);
});

test('refresh stores metadata only and requires exact original files before resuming', async () => {
  const h = harness();
  const original = h.entry('one');
  const [id] = h.api.enqueueClaruClips([original]);
  const saved = [...h.storage.values()][0];
  assert.ok(saved.includes('one.mp4'));
  assert.equal(saved.includes('filesByClientPartId'), false);
  assert.equal(saved.includes('uploadInstructions'), false);
  assert.equal(saved.includes('url'), false);
  const refreshed = harness({ savedStorage: h.storage, initialUser: null });
  refreshed.auth.setState({ user });
  assert.equal(refreshed.store.getState().items[0].status, 'needs_files');
  assert.equal(refreshed.creates.length, 0);
  assert.throws(
    () => refreshed.api.attachClaruQueueFiles(id, { video: new File(['wrong'], 'one.mp4') }),
    /original filename and byte size/
  );
  assert.throws(() => refreshed.api.resumeClaruQueueItem(id), /Reselect/);
  refreshed.api.attachClaruQueueFiles(id, original.filesByClientPartId);
  refreshed.api.resumeClaruQueueItem(id);
  await until(() => refreshed.store.getState().items[0].status === 'ready');
  assert.equal(refreshed.creates[0].input.externalRef, 'one');
  assert.equal([...refreshed.storage.values()][0].includes('private-signed'), false);
});

test('logout clears files and metadata and stale server responses cannot restore another account queue', async () => {
  const response = deferred();
  const h = harness({ onCreate: () => response.promise });
  h.api.enqueueClaruClips([h.entry('one')]);
  h.api.startClaruQueue();
  await until(() => h.creates.length === 1);
  h.auth.setState({ user: null });
  assert.equal(h.creates[0].signal.aborted, true);
  assert.equal(h.store.getState().items.length, 0);
  assert.equal(h.storage.size, 0);
  h.auth.setState({ user: { ...user, id: 'admin-b' } });
  response.resolve(h.resultFor(h.entry('one').input));
  await until(() => h.active.size === 0);
  assert.equal(h.store.getState().ownerId, 'admin-b');
  assert.equal(h.store.getState().items.length, 0);
  assert.equal(h.uploads.length, 0);
});

test('a different account cannot recover queue metadata persisted by the previous account', () => {
  const h = harness();
  h.api.enqueueClaruClips([h.entry('one')]);
  const other = harness({ savedStorage: h.storage, initialUser: { ...user, id: 'admin-b' } });
  assert.equal(other.store.getState().items.length, 0);
  assert.equal(other.storage.size, 0);
});

test('duplicate references and missing files reject an entire enqueue atomically', () => {
  const h = harness();
  assert.throws(
    () => h.api.enqueueClaruClips([h.entry('one'), h.entry('one')]),
    /already in the upload queue/
  );
  assert.equal(h.store.getState().items.length, 0);
  assert.throws(
    () => h.api.enqueueClaruClips([h.entry('one'), { ...h.entry('two'), filesByClientPartId: {} }]),
    /Reselect/
  );
  assert.equal(h.store.getState().items.length, 0);
});

test('single-clip transfer lock prevents bulk refresh and is not released by the failed queue attempt', async () => {
  const h = harness();
  const entry = h.entry('one');
  const staged = h.resultFor(entry.input);
  h.singles.setState({ pendingBySubmissionId: { [staged.submission.id]: { result: staged } } });
  const owner = new AbortController();
  h.active.set(staged.submission.id, owner);
  h.api.enqueueClaruClips([entry]);
  h.api.startClaruQueue();
  await until(() => h.store.getState().items[0].status === 'failed');
  assert.equal(h.creates.length, 0);
  assert.equal(h.active.get(staged.submission.id), owner);
  assert.equal(h.active.size, 1);
});

test('view-only admins cannot enqueue and losing manage permission pauses active work', async () => {
  const h = harness({
    initialUser: { ...user, userType: 'ADMIN' },
    onUpload: async ({ signal }) => {
      await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }));
      throw new Error('paused');
    },
  });
  assert.throws(() => h.api.enqueueClaruClips([h.entry('one')]), /permission/);
  assert.equal(h.creates.length, 0);
  h.auth.setState({ permissions: ['MANAGE_CLARU_DELIVERIES'] });
  h.api.enqueueClaruClips([h.entry('one')]);
  h.api.startClaruQueue();
  await until(() => h.uploads.length === 1);
  h.auth.setState({ permissions: [] });
  assert.equal(h.uploads[0].signal.aborted, true);
  await until(() => h.store.getState().items[0].status === 'paused');
  assert.throws(() => h.api.startClaruQueue(), /permission/);
  assert.equal(h.store.getState().isPaused, true);
  assert.equal(h.active.size, 0);
});

test('already sealed idempotent submissions are marked submitted without uploading or sealing', async () => {
  const h = harness({
    onCreate: (_input, _signal, result) => ({
      ...result,
      submission: { ...result.submission, sealed: true },
    }),
  });
  h.api.enqueueClaruClips([h.entry('one')]);
  h.api.startClaruQueue();
  await until(() => h.store.getState().items[0].status === 'submitted');
  assert.equal(h.uploads.length, 0);
  assert.equal(h.active.size, 0);
});

test('a manual seal updates ready queue metadata without repeating upload or creation', async () => {
  const h = harness();
  h.api.enqueueClaruClips([h.entry('one')]);
  h.api.startClaruQueue();
  await until(() => h.store.getState().items[0].status === 'ready');
  h.api.recordClaruQueueSubmission({
    ...h.resultFor(h.entry('one').input).submission,
    sealed: true,
  });
  assert.equal(h.store.getState().items[0].status, 'submitted');
  assert.equal(h.creates.length, 1);
  assert.equal(h.uploads.length, 1);
  assert.ok([...h.storage.values()][0].includes('submitted'));
});

test('corrupt stored entries are discarded while valid queue metadata is recovered', () => {
  const h = harness();
  h.api.enqueueClaruClips([h.entry('one')]);
  const [key, raw] = [...h.storage.entries()][0];
  const saved = JSON.parse(raw);
  saved.items.push({
    ...saved.items[0],
    id: 'corrupt',
    input: { ...saved.items[0].input, declared: {} },
  });
  h.storage.set(key, JSON.stringify(saved));
  const refreshed = harness({ savedStorage: h.storage });
  assert.equal(refreshed.store.getState().items.length, 1);
  assert.equal(refreshed.store.getState().items[0].status, 'needs_files');
});

test('account change drains old checkpoints before running the new account and never restores old files', async () => {
  const drain = deferred();
  let uploadNumber = 0;
  const h = harness({
    onUpload: async ({ signal }) => {
      uploadNumber += 1;
      if (uploadNumber > 1) return;
      await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }));
      await drain.promise;
      throw new Error('paused');
    },
  });
  h.api.enqueueClaruClips([h.entry('one')]);
  h.api.startClaruQueue();
  await until(() => h.uploads.length === 1);
  h.auth.setState({ user: { ...user, id: 'admin-b' } });
  h.api.enqueueClaruClips([h.entry('two')]);
  h.api.startClaruQueue();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.creates.length, 1, 'new owner must wait for old checkpoint drain');
  drain.resolve();
  await until(() => h.store.getState().items[0].status === 'ready');
  assert.equal(h.store.getState().items.length, 1);
  assert.equal(h.store.getState().items[0].input.externalRef, 'two');
  assert.equal(h.store.getState().items[0].ownerId, 'admin-b');
  assert.equal(h.active.size, 0);
  assert.equal([...h.storage.values()][0].includes('one.mp4'), false);
});

test('saved completed files are not required when reselecting the unfinished part', async () => {
  const h = harness();
  const entry = h.entry('one');
  const sidecar = new File(['metadata'], 'imu.json');
  entry.input.parts.push({
    clientPartId: 'imu',
    fileType: 'inputs',
    fileName: sidecar.name,
    byteSize: String(sidecar.size),
  });
  entry.filesByClientPartId.imu = sidecar;
  const [id] = h.api.enqueueClaruClips([entry]);
  const item = h.store.getState().items[0];
  h.store.setState({ items: [{ ...item, uploadedClientPartIds: ['video'] }] });
  const refreshed = harness({
    savedStorage: h.storage,
    onCreate: (_input, _signal, result) => ({
      ...result,
      submission: {
        ...result.submission,
        parts: result.submission.parts.map((part) => ({
          ...part,
          uploadState: part.clientPartId === 'video' ? 'uploaded' : 'pending',
        })),
      },
    }),
  });
  assert.equal(refreshed.store.getState().items[0].status, 'needs_files');
  refreshed.api.attachClaruQueueFiles(id, { imu: sidecar });
  refreshed.api.resumeClaruQueueItem(id);
  await until(() => refreshed.store.getState().items[0].status === 'ready');
  assert.equal(Object.keys(refreshed.uploads[0].filesByPartId).length, 1);
  assert.equal(refreshed.uploads[0].filesByPartId['part-one-imu'], sidecar);
});

test('duplicate references across batches are rejected before any submission is created', () => {
  const h = harness();
  const first = h.entry('one');
  const second = h.entry('one');
  second.input.batchId = 'another-batch';
  assert.throws(() => h.api.enqueueClaruClips([first, second]), /already in the upload queue/);
  assert.equal(h.store.getState().items.length, 0);
  h.api.enqueueClaruClips([first]);
  assert.throws(() => h.api.enqueueClaruClips([second]), /already in the upload queue/);
  assert.equal(h.creates.length, 0);
  assert.equal(
    h.api.claruQueueTransferKey('batch-1', 'one'),
    h.api.claruQueueTransferKey('another-batch', 'one')
  );
});

test('a staged single submission in another batch blocks reference refresh globally', async () => {
  const h = harness();
  const existing = h.entry('one');
  const staged = h.resultFor(existing.input);
  const owner = new AbortController();
  h.singles.setState({ pendingBySubmissionId: { [staged.submission.id]: { result: staged } } });
  h.active.set(staged.submission.id, owner);
  const other = h.entry('one');
  other.input.batchId = 'another-batch';
  const [id] = h.api.enqueueClaruClips([other]);
  h.api.startClaruQueue();
  await until(() => h.store.getState().items[0].status === 'failed');
  assert.equal(h.creates.length, 0);
  assert.equal(h.active.get(staged.submission.id), owner);
  h.active.delete(staged.submission.id);
  h.api.retryClaruQueueItem(id);
  await until(() => h.store.getState().items[0].status === 'failed');
  assert.match(h.store.getState().items[0].error, /another batch/);
  assert.equal(h.creates.length, 0);
});

test('a refreshed queue with every file checkpointed resumes without asking for local files', async () => {
  const h = harness();
  h.api.enqueueClaruClips([h.entry('one')]);
  const item = h.store.getState().items[0];
  h.store.setState({ items: [{ ...item, status: 'uploading', uploadedClientPartIds: ['video'] }] });
  const refreshed = harness({
    savedStorage: h.storage,
    onCreate: (_input, _signal, result) => ({
      ...result,
      submission: {
        ...result.submission,
        parts: result.submission.parts.map((part) => ({ ...part, uploadState: 'uploaded' })),
      },
      uploadInstructions: result.uploadInstructions.map((instruction) => ({
        ...instruction,
        uploadState: 'uploaded',
        upload: null,
      })),
    }),
  });
  assert.equal(refreshed.store.getState().items[0].status, 'paused');
  assert.equal(refreshed.creates.length, 0, 'recovery never autostarts');
  refreshed.api.startClaruQueue();
  await until(() => refreshed.store.getState().items[0].status === 'ready');
  assert.equal(refreshed.creates.length, 1);
  assert.equal(Object.keys(refreshed.uploads[0].filesByPartId).length, 0);
  assert.equal(refreshed.store.getState().items[0].input.externalRef, 'one');
});
