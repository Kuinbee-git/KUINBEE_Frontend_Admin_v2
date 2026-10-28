import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const postcss = require(
  require.resolve('postcss', { paths: [require.resolve('@tailwindcss/postcss')] })
);
const css = (
  await postcss([require('@tailwindcss/postcss')({ base: process.cwd() })]).process(
    await readFile('src/app/globals.css', 'utf8'),
    { from: resolve('src/app/globals.css') }
  )
).css;
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{SuppliersView}from'./src/components/suppliers/SuppliersView';import{SupplierWorkspaceView}from'./src/components/suppliers/SupplierWorkspaceView';import{useAuthStore}from'./src/store/auth.store';import{usePathname}from'next/navigation';const root=createRoot(document.getElementById('root'));const viewer=document.cookie.includes('fixture-role=viewer');useAuthStore.getState().setUser({id:'synthetic-admin',email:'admin@example.test',userType:viewer?'ADMIN':'SUPERADMIN',status:'ACTIVE',emailVerified:true});useAuthStore.getState().setPermissions(viewer?['VIEW_SUPPLIER']:[]);const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});function Route(){const p=usePathname();return p==='/dashboard/suppliers'?<SuppliersView/>:<SupplierWorkspaceView key={p} recordId={'application:'+p.split('/').at(-1)}/>};root.render(<QueryClientProvider client={client}><Route/></QueryClientProvider>);`,
    loader: 'jsx',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  define: {
    'process.env': JSON.stringify({
      NODE_ENV: 'development',
      NEXT_PUBLIC_API_URL: '/api',
      NEXT_PUBLIC_APP_ENV: 'local',
    }),
  },
  plugins: [
    {
      name: 'fixture-next',
      setup(builder) {
        builder.onResolve({ filter: /^next\/(navigation|link|image)$/ }, (args) => ({
          path: args.path,
          namespace: 'fixture',
        }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          resolveDir: process.cwd(),
          contents:
            args.path === 'next/navigation'
              ? `import{useSyncExternalStore}from'react';const sub=f=>{window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)};const snap=()=>location.pathname+location.search;export function nav(path){history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'))}export function useRouter(){return{push:nav,replace:nav}}export function useSearchParams(){useSyncExternalStore(sub,snap);return new URLSearchParams(location.search)}export function usePathname(){useSyncExternalStore(sub,snap);return location.pathname}`
              : args.path === 'next/link'
                ? `import React from'react';import{nav}from'next/navigation';export default function Link({href,children,...props}){return <a href={href} {...props} onClick={e=>{e.preventDefault();nav(href)}}>{children}</a>}`
                : `import React from'react';export default function Image({unoptimized,...props}){return <img {...props}/>}`,
          loader: 'jsx',
        }));
      },
    },
  ],
});
const identity = {
  supplierType: 'INDIVIDUAL',
  name: 'Synthetic CAD supplier',
  contactName: 'Synthetic CAD supplier',
  country: 'India',
  phone: '',
  website: '',
  role: 'Mechanical CAD designer',
};
const capabilities = {
  offerings: ['Native CAD assembly packages'],
  domains: ['Mechanical engineering', 'CAD/CAM'],
  modalities: ['CAD models'],
  formats: ['Siemens NX .prt', 'STEP'],
  countries: [],
  languages: [],
  description:
    'Mechanical CAD/CAM collection and engineering file preparation. Supplier-reported inventory requires verification.',
  collectionMethods: 'Workshop design and mould making',
  capacity: '13,730+ native NX files, supplier estimate; unique inventory not audited.',
  availability: 'Project-specific',
  equipment: '',
  experience: 'Mechanical design and mould-making',
  rights: 'Supplier claims workshop-origin rights; signed declaration pending.',
  compliance: 'Identity and licensing evidence pending',
  portfolio: 'https://example.test/portfolio',
  notes: 'Supplier declaration only',
};
const now = '2026-10-28T10:00:00.000Z';
const checklist = [
  ['identity', 'Identity Verification'],
  ['address', 'Address Verification'],
  ['rights', 'Data Ownership & Licensing Declaration'],
].map(([key, label]) => ({
  key,
  label,
  required: true,
  acceptedAlternatives: ['Accepted evidence'],
}));
const details = {
  legalName: '',
  registrationCountry: '',
  registrationNumber: '',
  address: '',
  notes: '',
};
const record = {
  recordId: 'application:synthetic-app',
  applicationId: 'synthetic-app',
  supplierId: null,
  name: identity.name,
  email: 'cad-supplier@example.test',
  supplierType: 'INDIVIDUAL',
  country: 'India',
  logoUrl: null,
  domains: capabilities.domains,
  offerings: capabilities.offerings,
  stage: 'INVITED',
  accountStatus: null,
  verificationStatus: 'DRAFT',
  contractComplete: null,
  reviewer: null,
  createdAt: now,
  updatedAt: now,
};
let model,
  notes,
  evidence,
  actions = [],
  errors = [];
const reset = () => {
  model = {
    record: { ...record },
    identity,
    capabilities,
    account: null,
    source: {
      source: 'REVIEWED_ENQUIRY',
      requirementRef: 'REQ-SYNTHETIC',
      importRef: 'source:synthetic',
      createdAt: now,
    },
    review: {
      id: 'synthetic-app',
      email: record.email,
      version: 2,
      userId: null,
      emailVerified: false,
      applicationStatus: 'INVITED',
      verificationStatus: 'DRAFT',
      identity,
      capabilities,
      verificationDetails: details,
      documentChecklist: checklist,
      documents: [],
      reviews: [
        {
          id: 'synthetic-review',
          phase: 'APPLICATION',
          version: 1,
          snapshot: {
            identity,
            capabilities,
            verificationDetails: details,
            documentChecklist: checklist,
            documents: [],
          },
          decision: 'INVITE',
          reason: null,
          submittedAt: now,
          reviewedAt: now,
          pickedByAdminId: 'synthetic-admin',
          internalNotes: 'PRIVATE RIGHTS FOLLOW-UP',
        },
      ],
      reason: null,
      reapplyAt: null,
      access: 'APPLICATION',
      canEdit: false,
      invitation: {
        id: 'synthetic-invitation',
        expiresAt: '2026-11-04T10:00:00.000Z',
        acceptedAt: null,
        revokedAt: null,
      },
      notifications: [
        {
          id: 'synthetic-notification',
          queuedAt: now,
          attempts: 1,
          nextAttemptAt: now,
          deliveryState: 'completed',
        },
      ],
    },
    reviewActors: { 'synthetic-review': { id: 'synthetic-admin', name: 'Review admin' } },
    contract: null,
    legacyKyc: null,
    entries: [],
    entriesTotal: 0,
    activity: [],
    marketplace: null,
    permissions: { review: true, invite: true, analytics: true },
  };
  notes = [];
  evidence = [];
};
reset();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://fixture.test');
    const viewer = (req.headers.cookie ?? '').includes('fixture-role=viewer');
    if (url.pathname === '/style.css') {
      res.writeHead(200, { 'content-type': 'text/css' });
      return res.end(css);
    }
    if (url.pathname === '/bundle.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });
      return res.end(bundle.outputFiles[0].text);
    }
    if (!url.pathname.startsWith('/api/')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:var(--bg-surface);color:var(--text-primary)"><main id="root"></main><script src="/bundle.js"></script></body></html>'
      );
    }
    let data;
    if (url.pathname.endsWith('/my-permissions'))
      data = { permissions: viewer ? ['VIEW_SUPPLIER'] : [] };
    else if (url.pathname === '/api/v1/admin/suppliers/directory') {
      let items = [model.record];
      const stage = url.searchParams.get('stage');
      if (stage === 'NEEDS_REVIEW' && !model.record.stage.includes('SUBMITTED')) items = [];
      const q = url.searchParams.get('q');
      if (q && !JSON.stringify(model.record).toLowerCase().includes(q.toLowerCase())) items = [];
      data = { items, total: items.length, page: 1, pageSize: 20 };
    } else if (url.pathname.endsWith('/history')) {
      if (viewer) {
        res.writeHead(403, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: { message: 'Forbidden' } }));
      }
      data = {
        items:
          url.searchParams.get('kind') === 'INVITATION'
            ? [
                {
                  id: 'grant',
                  createdAt: now,
                  expiresAt: '2026-11-04T10:00:00.000Z',
                  acceptedAt: null,
                  revokedAt: null,
                  state: 'AWAITING_ACCEPTANCE',
                  createdBy: { id: 'synthetic-admin', name: 'Review admin' },
                },
              ]
            : url.searchParams.get('kind') === 'NOTE'
              ? notes
              : url.searchParams.get('kind') === 'EVIDENCE'
                ? evidence
                : [
                    {
                      id: 'audit1',
                      action: 'CREATED',
                      createdAt: now,
                      actor: { id: 'synthetic-admin', name: 'Review admin' },
                      description: 'Supplier capability import',
                    },
                  ],
        nextCursor: null,
      };
    } else if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const bytes = Buffer.concat(chunks);
      const isFile = url.pathname.endsWith('/evidence');
      const body = isFile ? bytes : JSON.parse(bytes.toString());
      actions.push({ path: url.pathname, body, headers: req.headers });
      if (url.pathname.endsWith('/notes')) {
        notes.unshift({
          id: 'note' + notes.length,
          kind: 'NOTE',
          body: body.body,
          name: null,
          sourceUrl: null,
          contentType: null,
          size: null,
          sha256: null,
          createdAt: now,
          author: { id: 'synthetic-admin', name: 'Review admin' },
        });
        data = { id: notes[0].id };
      } else if (isFile) {
        const metadata = JSON.parse(
          Buffer.from(req.headers['x-evidence-metadata'], 'base64').toString()
        );
        evidence.push({
          id: 'evidence1',
          kind: 'EVIDENCE',
          body: metadata.summary,
          name: metadata.name,
          sourceUrl: metadata.sourceUrl,
          contentType: req.headers['content-type'],
          size: bytes.length,
          sha256: 'synthetic-sha256',
          createdAt: now,
          author: { id: 'synthetic-admin', name: 'Review admin' },
        });
        data = { id: 'evidence1' };
      } else if (url.pathname.endsWith('/pick')) {
        model.review.reviews[0].pickedByAdminId = 'synthetic-admin';
        data = model.review;
      } else if (url.pathname.endsWith('/decision')) {
        assert.equal(body.reviewId, 'synthetic-review');
        assert.equal(body.version, model.review.version);
        model.review.reviews[0].decision = body.decision;
        model.review.version++;
        model.review.applicationStatus = 'INVITED';
        model.record.stage = 'INVITED';
        data = model.review;
      } else data = model.review;
    } else if (url.pathname.includes('/evidence/'))
      data = { url: 'https://private.example.test/download' };
    else {
      data = structuredClone(model);
      if (viewer) {
        data.review = null;
        data.entries = [];
        data.activity = [];
        data.permissions = { review: false, invite: false, analytics: false };
      }
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: true, data }));
  } catch (error) {
    errors.push(error.message);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { message: error.message } }));
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;
const artifacts = resolve('.artifacts/supplier-workspace');
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
page.setDefaultTimeout(10000);
const browserErrors = [];
page.on('pageerror', (e) => browserErrors.push(e.message));
try {
  await page.goto(base + '/dashboard/suppliers');
  await page.getByRole('link', { name: identity.name, exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Search suppliers', exact: true }).fill('CAD');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('textbox', { name: 'country', exact: true }).fill('India');
  await page.getByRole('link', { name: identity.name, exact: true }).click();
  await page.getByRole('tab', { name: 'Capabilities', exact: true }).click();
  await page.getByText(capabilities.capacity, { exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Verification', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Approve verification', exact: true }).count(),
    0
  );
  await page
    .getByText('Waiting for the supplier to accept their invitation and set up their account.', {
      exact: true,
    })
    .waitFor();
  await page.getByRole('button', { name: 'Replace and resend invitation', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(actions.length, 0, 'opening/cancelling a confirmation sends no mutation');
  await page.getByRole('tab', { name: 'Reviews & activity', exact: true }).click();
  await page
    .getByLabel('Add a private note', { exact: true })
    .fill('Private source rights follow-up');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByText('Private source rights follow-up', { exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Source evidence', exact: true }).click();
  const payload = Buffer.from(JSON.stringify({ synthetic: true, source: 'x'.repeat(130000) }));
  await page
    .getByLabel('Evidence file', { exact: true })
    .setInputFiles({ name: 'review.json', mimeType: 'application/json', buffer: payload });
  await page
    .getByLabel('Evidence summary', { exact: true })
    .fill('Original synthetic source review');
  await page.getByRole('button', { name: 'Store private evidence', exact: true }).click();
  await page.getByRole('button', { name: 'review.json', exact: true }).waitFor();
  assert.equal(actions.find((a) => a.path.endsWith('/evidence')).body.length, payload.length);
  await page.getByRole('link', { name: 'Back to suppliers', exact: true }).click();
  await page.getByRole('link', { name: identity.name, exact: true }).waitFor();
  assert(new URL(page.url()).searchParams.get('country') === 'India');
  assert(new URL(page.url()).searchParams.get('q') === 'CAD');
  for (const theme of ['light', 'dark'])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 });
      await page.evaluate(
        (theme) => document.documentElement.classList.toggle('dark', theme === 'dark'),
        theme
      );
      await page.screenshot({
        path: resolve(artifacts, `directory-${theme}-${width}.png`),
        fullPage: true,
      });
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'directory must not overflow the viewport'
      );
    }
  await page.getByRole('link', { name: identity.name, exact: true }).click();
  await page.getByRole('tab', { name: 'Capabilities', exact: true }).click();
  await page.getByText(capabilities.capacity, { exact: true }).waitFor();
  for (const theme of ['light', 'dark'])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 });
      await page.evaluate(
        (theme) => document.documentElement.classList.toggle('dark', theme === 'dark'),
        theme
      );
      await page.screenshot({
        path: resolve(artifacts, `detail-${theme}-${width}.png`),
        fullPage: true,
      });
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'detail must not overflow the viewport'
      );
    }
  // Current submission: a reviewer must pick before the invite decision, and
  // every mutation uses the frozen review id/current version.
  reset();
  model.record.stage = 'APPLICATION_SUBMITTED';
  model.review.applicationStatus = 'SUBMITTED';
  model.review.invitation = null;
  model.review.reviews[0].decision = null;
  model.review.reviews[0].pickedByAdminId = null;
  await page.goto(base + '/dashboard/supplier-applications/synthetic-app');
  await page.getByRole('tab', { name: 'Verification', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Invite supplier', exact: true }).isDisabled());
  await page.getByRole('button', { name: 'Pick submission', exact: true }).click();
  await page.getByRole('button', { name: 'Invite supplier', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Invite supplier', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm action', exact: true }).click();
  await page.getByRole('button', { name: 'Replace and resend invitation', exact: true }).waitFor();
  const viewer = await browser.newContext();
  await viewer.addCookies([{ name: 'fixture-role', value: 'viewer', url: base }]);
  const restricted = await viewer.newPage();
  restricted.on('pageerror', (e) => browserErrors.push(e.message));
  await restricted.goto(base + '/dashboard/supplier-applications/synthetic-app');
  await restricted.getByRole('tab', { name: 'Capabilities', exact: true }).waitFor();
  assert.equal(
    await restricted.getByRole('tab', { name: 'Source evidence', exact: true }).count(),
    0
  );
  assert.equal(
    await restricted.getByRole('tab', { name: 'Reviews & activity', exact: true }).count(),
    0
  );
  await restricted.getByRole('tab', { name: 'Verification', exact: true }).click();
  await restricted
    .getByText('Document evidence and review decisions require supplier verification permission.', {
      exact: true,
    })
    .waitFor();
  assert(
    !(await restricted
      .locator('body')
      .innerText()
      .then((t) => t.includes('PRIVATE RIGHTS FOLLOW-UP')))
  );
  await viewer.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(browserErrors, []);
  await writeFile(
    resolve(artifacts, 'verification.json'),
    JSON.stringify(
      {
        directorySearchAndReturnFilters: true,
        privateNoteSaved: true,
        sourceUploadBytes: payload.length,
        reviewPickAndDecision: true,
        restrictedRoleRedaction: true,
        responsiveThemes: ['light', 'dark'],
        viewports: [1440, 390],
        browserErrors,
      },
      null,
      2
    )
  );
  console.log(
    'Supplier workspace browser checks passed: directory filters, persisted navigation, notes, private evidence, exact-version review, restricted access, light/dark and mobile/desktop.'
  );
} catch (error) {
  await page.screenshot({ path: resolve(artifacts, 'failure.png'), fullPage: true });
  await writeFile(resolve(artifacts, 'failure.html'), await page.content());
  throw error;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
