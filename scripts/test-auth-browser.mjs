import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.AUTH_TEST_BASE_URL || 'http://localhost:3018';
const browser = await chromium.launch();
const user = {
  id: 'auth-regression',
  email: 'admin@example.test',
  userType: 'SUPERADMIN',
  status: 'ACTIVE',
  emailVerified: true,
};

async function check(name, run, options = {}) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const model = { authRequests: 0, loginNavigations: 0, errors: [], ...options };
  page.on('pageerror', (error) => model.errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/login') model.loginNavigations++;
  });
  await context.route('**/api/**', async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    if (endpoint.endsWith('/auth/me')) {
      model.authRequests++;
      if (model.networkError) return route.abort();
      if (model.slow) await new Promise((resolve) => setTimeout(resolve, 400));
      if (!model.authenticated)
        return route.fulfill({
          status: 401,
          json: {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          },
        });
      return route.fulfill({
        json: {
          success: true,
          data: { user: { ...user, userType: model.userType || user.userType } },
        },
      });
    }
    if (endpoint.endsWith('/my-permissions'))
      return route.fulfill({ json: { success: true, data: { permissions: [] } } });
    if (endpoint.endsWith('/auth/login'))
      return route.fulfill({
        status: 401,
        json: {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
        },
      });
    return route.fulfill({
      status: model.expire ? 401 : 503,
      json: {
        success: false,
        error: { code: model.expire ? 'UNAUTHORIZED' : 'UNAVAILABLE', message: 'Test response' },
      },
    });
  });
  try {
    await run(page, model);
    await page.waitForTimeout(300);
    assert.ok(model.authRequests <= 2, `bounded session lookups: ${model.authRequests}`);
    assert.ok(model.loginNavigations <= 3, `bounded navigation: ${model.loginNavigations}`);
    assert.deepEqual(model.errors, []);
    console.log(`PASS ${name} (${model.authRequests} session checks)`);
  } finally {
    await context.close();
  }
}
const loginVisible = async (page) => {
  await page.waitForURL('**/login');
  await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
};
try {
  await check('signed-out dashboard reaches login without a refetch loop', async (page, model) => {
    await page.goto(base + '/dashboard');
    await loginVisible(page);
    assert.equal(model.authRequests, 1);
  });
  await check('signed-out login renders after one discovery request', async (page, model) => {
    await page.goto(base + '/login');
    await loginVisible(page);
    assert.equal(model.authRequests, 1);
  });
  await check(
    'slow session discovery still settles on login',
    async (page) => {
      await page.goto(base + '/dashboard');
      await loginVisible(page);
    },
    { slow: true }
  );
  await check(
    'service failure is actionable and retry can recover',
    async (page, model) => {
      await page.goto(base + '/dashboard');
      await page.getByText('Unable to verify your session', { exact: true }).waitFor();
      assert.equal(model.authRequests, 1);
      model.networkError = false;
      await page.getByRole('button', { name: 'Retry session check', exact: true }).click();
      await loginVisible(page);
    },
    { networkError: true }
  );
  await check(
    'authenticated login redirects to dashboard once',
    async (page, model) => {
      await page.goto(base + '/login');
      await page.waitForURL('**/dashboard');
      await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).waitFor();
      assert.equal(model.authRequests, 1);
    },
    { authenticated: true }
  );
  await check(
    'expired protected requests redirect without rediscovering the old identity',
    async (page, model) => {
      await page.goto(base + '/dashboard');
      await loginVisible(page);
      assert.equal(model.authRequests, 1);
    },
    { authenticated: true, expire: true }
  );
  await check(
    'non-admin session settles on login',
    async (page) => {
      await page.goto(base + '/dashboard');
      await loginVisible(page);
    },
    { authenticated: true, userType: 'SUPPLIER' }
  );
  await check('invalid credentials stay on the login form', async (page) => {
    await page.goto(base + '/login');
    await loginVisible(page);
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('invalid-test-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page
      .getByText('Invalid email or password. Please check your credentials and try again.', {
        exact: true,
      })
      .waitFor();
    assert.equal(new URL(page.url()).pathname, '/login');
  });
} finally {
  await browser.close();
}
