import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const adminRoot = resolve(scriptDirectory, '..');
const backendContractPath = resolve(
  adminRoot,
  '../../backend/packages/api-contracts/src/common.schema.ts'
);
const frontendContractPath = resolve(adminRoot, 'src/lib/constants/permissions.ts');

const extractArrayValues = (source, startPattern, endPattern, sourceName) => {
  const start = source.search(startPattern);
  if (start < 0) throw new Error(`Could not find permission list in ${sourceName}`);

  const tail = source.slice(start);
  const end = tail.search(endPattern);
  if (end < 0) throw new Error(`Could not find the end of the permission list in ${sourceName}`);

  return [...tail.slice(0, end).matchAll(/["']([A-Z][A-Z0-9_]*)["']/g)].map((match) => match[1]);
};

const [backendSource, frontendSource] = await Promise.all([
  readFile(backendContractPath, 'utf8'),
  readFile(frontendContractPath, 'utf8'),
]);

const backendPermissions = extractArrayValues(
  backendSource,
  /export const PermissionSchema\s*=\s*z\.enum\s*\(\s*\[/,
  /\]\s*\)/,
  backendContractPath
);
const frontendPermissions = extractArrayValues(
  frontendSource,
  /const PERMISSION_VALUES\s*=\s*\[/,
  /\]\s*as const/,
  frontendContractPath
);

const backendSet = new Set(backendPermissions);
const frontendSet = new Set(frontendPermissions);
const missing = backendPermissions.filter((permission) => !frontendSet.has(permission));
const unknown = frontendPermissions.filter((permission) => !backendSet.has(permission));
const duplicates = frontendPermissions.filter(
  (permission, index) => frontendPermissions.indexOf(permission) !== index
);

if (missing.length || unknown.length || duplicates.length) {
  const details = [
    missing.length ? `Missing in admin: ${missing.join(', ')}` : null,
    unknown.length ? `Unknown in admin: ${unknown.join(', ')}` : null,
    duplicates.length ? `Duplicated in admin: ${[...new Set(duplicates)].join(', ')}` : null,
  ].filter(Boolean);
  throw new Error(`Admin permission contract drifted from backend.\n${details.join('\n')}`);
}

console.log(`Permission contract verified: ${frontendPermissions.length} canonical permissions.`);
