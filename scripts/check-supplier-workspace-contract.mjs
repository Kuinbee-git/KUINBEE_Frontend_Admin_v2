import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const digest = '196705f13ec61e63e8ea57562d2cb4796e5b4c4c6e99a1e06b286b93dd039596';
assert.equal(
  createHash('sha256')
    .update(readFileSync(new URL('../src/lib/supplier-workspace-contracts.ts', import.meta.url)))
    .digest('hex'),
  digest,
  'Refresh the canonical admin supplier workspace contract and its pinned digest together'
);
console.log('Canonical admin supplier workspace contract copy verified');
