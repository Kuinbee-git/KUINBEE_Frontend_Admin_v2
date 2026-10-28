import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const digest = '005f2b5989288dd5d8419af5e425a5045a6ff3c93149881ce0f473f8d1cdf0a4';
assert.equal(
  createHash('sha256')
    .update(readFileSync(new URL('../src/lib/supplier-workspace-contracts.ts', import.meta.url)))
    .digest('hex'),
  digest,
  'Refresh the canonical admin supplier workspace contract and its pinned digest together'
);
console.log('Canonical admin supplier workspace contract copy verified');
