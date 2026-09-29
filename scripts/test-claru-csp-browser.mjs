/* Exercise the actual metadata reader under the built admin CSP; no uploads. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { chromium } from 'playwright';

const base = process.env.CLARU_CSP_TEST_BASE_URL || 'http://localhost:3043';
const helperSource = await fs.readFile(
  new URL('../src/components/claru/claruBulkFormUtils.ts', import.meta.url),
  'utf8'
);
const helperCode = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const fixture = await fs.readFile(new URL('./fixtures/claru-csp-metadata.mp4', import.meta.url));
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await context.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 401,
      json: {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No session in this CSP test' },
      },
    });
  });
  const response = await page.goto(`${base}/login`);
  const policy = response.headers()['content-security-policy'];
  assert.ok(policy, 'test exercises a real server-provided CSP');
  await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();

  // Execute the real helper as a nonce-authorized script. Do not disable CSP or
  // bypass it with a routing fixture: browser media loading must obey the policy.
  await page.evaluate((code) => {
    const script = document.createElement('script');
    script.nonce = document.querySelector('script[nonce]').nonce;
    script.textContent = `(function () {
      const exports = {};
      const require = () => ({});
      ${code}
      window.readClaruDurationForCspTest = exports.readClaruVideoDuration;
    })();`;
    document.head.append(script);
  }, helperCode);

  const metadata = await page.evaluate(async (base64) => {
    const violations = [];
    const capture = (event) =>
      violations.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    document.addEventListener('securitypolicyviolation', capture);
    const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
    const file = new File([bytes], 'metadata.mp4', { type: 'video/mp4' });
    const duration = await window.readClaruDurationForCspTest(file, new AbortController().signal);
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.removeEventListener('securitypolicyviolation', capture);
    return { duration, violations };
  }, fixture.toString('base64'));
  assert.deepEqual(metadata.violations, [], 'local video does not trigger a CSP violation');
  assert.ok(
    metadata.duration > 0.9 && metadata.duration < 1.1,
    `actual local MP4 duration is measured: ${metadata.duration}`
  );
  console.log('PASS real Claru metadata reader measures a local MP4 under production CSP');

  const blocked = await page.evaluate(async () => {
    const violations = [];
    const capture = (event) =>
      violations.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    document.addEventListener('securitypolicyviolation', capture);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = 'https://media.invalid/blocked.mp4';
    video.load();
    await new Promise((resolve) => setTimeout(resolve, 100));
    video.removeAttribute('src');
    video.load();
    document.removeEventListener('securitypolicyviolation', capture);
    return violations;
  });
  assert.ok(
    blocked.some(
      (event) =>
        event.directive === 'media-src' && event.blocked.startsWith('https://media.invalid')
    ),
    'unapproved remote media remains blocked'
  );
  const connect = policy.split(';').find((directive) => directive.trim().startsWith('connect-src'));
  assert.ok(connect.includes('https://*.amazonaws.com'), 'existing storage allowlist is preserved');
  assert.equal(
    connect.split(/\s+/).includes('https:'),
    false,
    'storage policy was not widened to all HTTPS'
  );
  console.log('PASS remote media remains blocked and storage allowlist remains restrictive');
  await context.close();
} finally {
  await browser.close();
}
