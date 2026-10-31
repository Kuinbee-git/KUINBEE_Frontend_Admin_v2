import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({
  stdin: {
    contents: `export{canAccess}from'./src/lib/authorization/authorization';export{getRouteAccessRequirement}from'./src/lib/authorization/route-access';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { canAccess, getRouteAccessRequirement } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
);
const requirement = getRouteAccessRequirement('/dashboard/suppliers/synthetic/catalogue');
for (const permissions of [
  [],
  ['VIEW_SUPPLIER'],
  ['CREATE_PLATFORM_DATASET'],
  ['VIEW_DATASET_PROPOSALS'],
  ['IMPORT_SUPPLIER_CATALOGUE'],
  ['MANAGE_SUPPLIER_PREPARATION_CAPACITY'],
])
  assert.equal(canAccess('ADMIN', permissions, requirement), false, permissions.join(','));
assert.equal(canAccess('ADMIN', ['VIEW_SUPPLIER', 'IMPORT_SUPPLIER_CATALOGUE'], requirement), true);
assert.equal(
  canAccess('ADMIN', ['VIEW_SUPPLIER', 'MANAGE_SUPPLIER_PREPARATION_CAPACITY'], requirement),
  true
);
assert.equal(canAccess('SUPERADMIN', [], requirement), true);
assert.equal(canAccess('USER', ['VIEW_SUPPLIER', 'IMPORT_SUPPLIER_CATALOGUE'], requirement), false);
console.log(
  'PASS catalogue route requires supplier-directory access and an explicit catalogue/capacity permission'
);
