import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/components/claru/claruMetadataUtils.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, TextEncoder, Object, Date, JSON });
const { claruMetadataDraft, readClaruMetadata } = exports;
const schema = { enforced: true, fields: [
  { name: 'city', type: 'string', required: true },
  { name: 'date', type: 'date', required: true },
  { name: 'start', type: 'timestamp', required: true },
  { name: 'confirmed', type: 'boolean', required: true },
  { name: 'temperature', type: 'number' }, { name: 'count', type: 'integer' },
  { name: 'activity', type: 'enum', options: ['Kitchen', 'Workshop'] },
  { name: 'intrinsics', type: 'object', required: true, fields: [
    { name: 'width', type: 'integer', required: true },
    { name: 'K', type: 'array', required: true, items: { type: 'array', items: { type: 'number' } } },
  ] },
] };
const custom = { city: 'Pune', date: '2026-11-04', start: '2026-11-04T09:12:00+05:30', confirmed: false, count: 0,
  intrinsics: { width: 1920, K: [[1200, 0, 960], [0, 1200, 720], [0, 0, 1]] }, Unlisted: { values: [true, false, null, 0] } };
const serialize = (value) => JSON.parse(JSON.stringify(value));

test('metadata round trip preserves false, zero, nested camera data, unlisted fields and original case', () => {
  const result = readClaruMetadata(schema, claruMetadataDraft(custom), custom);
  assert.deepEqual(serialize(result.custom), custom);
  assert.equal(result.errors.length, 0);
});

test('all missing and invalid paths are shown together, including nested matrix elements', () => {
  const draft = { ...claruMetadataDraft(custom), city: ' ', start: '2026-11-04T09:12:00', count: '1.5', activity: 'kitchen', intrinsics: '{"K":[[1,"wrong"]]}' };
  const result = readClaruMetadata(schema, draft);
  for (const name of ['city', 'start', 'count', 'activity', 'intrinsics.width', 'intrinsics.K[0][1]']) assert.ok(result.errors.some((error) => error.includes(name)), name);
});

test('ISO dates are calendar-valid; timestamps require seconds and an explicit zone', () => {
  for (const value of ['2026-02-30', '2026-13-01', 'yesterday']) {
    assert.ok(readClaruMetadata(schema, { ...claruMetadataDraft(custom), date: value }).errors.some((error) => error.includes('date')));
  }
  for (const value of ['2026-11-04', '2026-11-04T09:12', '2026-11-04T09:12:00']) {
    assert.ok(readClaruMetadata(schema, { ...claruMetadataDraft(custom), start: value }).errors.some((error) => error.includes('start')));
  }
  for (const value of ['2026-11-04T09:12:00Z', '2026-11-04T09:12:00.250-03:00']) assert.equal(readClaruMetadata(schema, { ...claruMetadataDraft(custom), start: value }).errors.length, 0);
  for (const value of ['2026-11-04T09:12:00', '2026-11-04T09:12']) assert.equal(readClaruMetadata(schema, { ...claruMetadataDraft(custom), date: value }).errors.length, 0);
});

test('warning-only schemas keep mismatches and report warnings but malformed JSON always blocks upload', () => {
  const result = readClaruMetadata({ ...schema, enforced: false }, { city: 'Pune', count: '1.5' });
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.length > 0);
  assert.equal(result.custom.count, 1.5);
  assert.ok(readClaruMetadata({ ...schema, enforced: false }, { intrinsics: '{broken' }).errors.length > 0);
});

test('reserved keys and oversized UTF-8 metadata fail before enqueue', () => {
  for (const key of ['constructor', 'toString', '__proto__', 'valueOf']) {
    assert.ok(readClaruMetadata(schema, { ...claruMetadataDraft(custom), intrinsics: `{"${key}":true}` }).errors.some((error) => error.includes('reserved')));
  }
  assert.ok(readClaruMetadata(schema, { ...claruMetadataDraft(custom), city: 'é'.repeat(20_000) }).errors.some((error) => error.includes('32 KiB')));
  assert.ok(readClaruMetadata(schema, { ...claruMetadataDraft(custom), intrinsics: '{"unchecked_number":1e999}' }).errors.some((error) => error.includes('finite JSON number')));
});
