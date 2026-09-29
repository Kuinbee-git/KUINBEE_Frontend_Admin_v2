import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { File } from 'node:buffer';

// Run the real browser upload engine with a deterministic storage transport.
function harness({ onPut, onCheckpoint } = {}) {
  const puts = [],
    checkpoints = [],
    completes = [];
  class Xhr extends EventTarget {
    upload = new EventTarget();
    headers = {};
    open(method, url) {
      this.method = method;
      this.url = url;
    }
    setRequestHeader(name, value) {
      this.headers[name] = value;
    }
    getResponseHeader() {
      return this.etag === undefined ? '"etag"' : this.etag;
    }
    abort() {
      this.aborted = true;
      this.dispatchEvent(new Event('abort'));
    }
    send(body) {
      this.body = body;
      puts.push(this);
      Promise.resolve().then(async () => {
        if (onPut) await onPut(this);
        if (this.aborted) return;
        this.status ??= 200;
        this.dispatchEvent(new Event('load'));
      });
    }
  }
  const services = {
    checkpointClaruPart: async (input) => {
      checkpoints.push(input);
      await onCheckpoint?.(input);
    },
    completeClaruPart: async (input) => {
      completes.push(input);
      return {
        ...staged.submission,
        parts: staged.submission.parts.map((part) =>
          part.id === input.partId ? { ...part, uploadState: 'uploaded' } : part
        ),
      };
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync(new URL('../src/services/claru-upload.service.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: () => services,
    process,
    XMLHttpRequest: Xhr,
    AbortController,
  });
  const file = new File([Buffer.from('ABCDEFGHIJ')], 'clip.mp4', { type: 'video/mp4' });
  const part = {
    id: 'part',
    fileName: file.name,
    byteSize: String(file.size),
    uploadedParts: [],
    uploadState: 'pending',
  };
  const instruction = {
    localPartId: part.id,
    uploadState: 'pending',
    upload: {
      kind: 'multipart',
      uploadId: 'generation-2',
      partSizeBytes: 3,
      headers: {},
      parts: [1, 2, 3, 4].map((partNumber) => ({
        partNumber,
        url: `https://storage.invalid/${partNumber}`,
      })),
    },
  };
  const staged = {
    submission: { id: 'submission', parts: [part] },
    uploadInstructions: [instruction],
  };
  const controller = new AbortController();
  const run = (overrides = {}) =>
    exports.uploadClaruSubmissionFiles({
      staged,
      filesByPartId: { part: file },
      signal: controller.signal,
      onProgress: () => {},
      ...overrides,
    });
  return { puts, checkpoints, completes, file, part, instruction, staged, controller, run };
}

test('multipart follows supplied boundaries, skips checkpoints, and saves upload generation', async () => {
  const h = harness();
  h.part.uploadedParts = [{ partNumber: 2, etag: '"saved"' }];
  await h.run();
  assert.deepEqual(await Promise.all(h.puts.map((put) => put.body.text())), ['ABC', 'GHI', 'J']);
  assert.deepEqual(h.checkpoints.map((item) => item.partNumber).sort(), [1, 3, 4]);
  assert.ok(h.checkpoints.every((item) => item.uploadId === 'generation-2'));
  assert.equal(h.completes.length, 1);
  assert.ok(h.puts.every((put) => put.body.type === '' && Object.keys(put.headers).length === 0));
});
test('PUT sends every supplied header without inventing a sidecar content type', async () => {
  const h = harness();
  h.instruction.upload = {
    kind: 'put',
    url: 'https://storage.invalid/file',
    headers: { 'x-amz-meta-source': 'supplier_upload', 'x-extra-signed': 'verbatim' },
  };
  await h.run();
  assert.deepEqual(h.puts[0].headers, h.instruction.upload.headers);
  assert.equal(h.puts[0].body.type, '');
  assert.equal(h.puts[0].body.size, 10);
});
test('MP4 PUT preserves the declared content type', async () => {
  const h = harness();
  h.instruction.upload = {
    kind: 'put',
    url: 'https://storage.invalid/file',
    headers: { 'content-type': 'video/mp4', 'x-amz-meta-source': 'supplier_upload' },
  };
  await h.run();
  assert.equal(h.puts[0].headers['content-type'], 'video/mp4');
});
test('missing ETag fails before checkpoint or completion', async () => {
  const h = harness({
    onPut: (put) => {
      put.etag = null;
    },
  });
  await assert.rejects(h.run(), /did not expose its ETag/);
  assert.equal(h.checkpoints.length, 0);
  assert.equal(h.completes.length, 0);
});
test('first failure aborts siblings and drains pending checkpoint before retry', async () => {
  let releaseCheckpoint, signalCheckpoint;
  const checkpointStarted = new Promise((resolve) => {
    signalCheckpoint = resolve;
  });
  const checkpointBlocked = new Promise((resolve) => {
    releaseCheckpoint = resolve;
  });
  const h = harness({
    onPut: async (put) => {
      if (put.url.endsWith('/2')) {
        await checkpointStarted;
        put.status = 403;
      }
      if (put.url.endsWith('/3') || put.url.endsWith('/4')) await checkpointBlocked;
    },
    onCheckpoint: async () => {
      signalCheckpoint();
      await checkpointBlocked;
    },
  });
  let settled = false;
  const promise = h.run().finally(() => {
    settled = true;
  });
  const rejection = assert.rejects(promise, /status 403/);
  await checkpointStarted;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false, 'must not allow retry while old checkpoints can still write');
  assert.ok(h.puts.slice(2).every((put) => put.aborted));
  releaseCheckpoint();
  await rejection;
  assert.equal(h.completes.length, 0);
});
test('pause aborts storage and never completes a file', async () => {
  const h = harness({ onPut: () => h.controller.abort() });
  await assert.rejects(h.run(), /paused/);
  assert.equal(h.completes.length, 0);
});
test('wrong file name or byte size is rejected before any upload', async () => {
  const h = harness();
  await assert.rejects(
    h.run({ filesByPartId: { part: new File(['wrong'], 'wrong.mp4') } }),
    /exact declared name and byte size/
  );
  assert.equal(h.puts.length, 0);
});
test('already uploaded parts are skipped without requiring local files', async () => {
  const h = harness();
  h.instruction.uploadState = 'uploaded';
  await h.run({ filesByPartId: {} });
  assert.equal(h.puts.length, 0);
  assert.equal(h.completes.length, 0);
});
