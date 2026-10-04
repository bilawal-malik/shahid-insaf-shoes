/**
 * Browser end-to-end journeys — every critical user flow, clicked for real.
 * Uses the system Chrome/Edge install (channel: 'chrome') — no browser download.
 *
 *   npm run dev        (web :3100, api :4100, seeded)
 *   npm run e2e        (from repo root)
 */
import { chromium } from 'playwright';

const WEB = process.env.E2E_WEB || 'http://localhost:3100';
const API = process.env.E2E_API || 'http://localhost:4100/api/v1';
const stamp = Date.now();
const EMAIL = `e2e+${stamp}@test.dev`;
const NAME = `E2E Tester ${stamp}`;
const PASS = `E2e@${stamp % 1000000}a`;
const PASS2 = `E2e@${stamp % 1000000}b`;
const PHONE = '03001234567';

let passed = 0;
let failed = 0;
let orderNumber = '';
const failures = [];

function ok(label) {
  passed += 1;
  process.stdout.write(`  ok   ${label}\n`);
}

function bad(label, extra) {
  failed += 1;
  failures.push(extra ? `${label} — ${extra}` : label);
  process.stdout.write(`  FAIL ${label}${extra ? ` — ${extra}` : ''}\n`);
}

function check(cond, label, extra) {
  if (cond) ok(label);
  else bad(label, extra);
}

async function journey(name, fn) {
  process.stdout.write(`--- ${name}\n`);
  failedResponses.length = 0;
  try {
    await fn();
  } catch (err) {
    let where = '';
    try {
      where = ` @ ${pageUrl()}`;
      const alerts = await page
        .locator('[role="alert"], .text-red-600, .text-red-700, .text-red-800')
        .allTextContents();
      if (alerts.filter(Boolean).length) where += ` alerts=[${alerts.filter(Boolean).join(' | ')}]`;
      if (failedResponses.length) where += ` http=[${failedResponses.join(', ')}]`;
    } catch {
      /* page may be closed */
    }
    bad(
      name,
      `${String(err.message || err)
        .split('\n')[0]
        .slice(0, 140)}${where}`
    );
  }
}

let currentPage = null;
const failedResponses = [];
function pageUrl() {
  return currentPage ? currentPage.url() : '?';
}

async function hasCookie(page, name) {
  const cookies = await page.context().cookies();
  return cookies.some((c) => c.name === name);
}

async function waitForCookie(page, name, want = true, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if ((await hasCookie(page, name)) === want) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function signIn(page, email, password) {
  await page.goto(`${WEB}/login`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /Sign In/ }).click();
  return waitForCookie(page, 'sis_jwt', true, 20000);
}

async function main() {
  const res = await fetch(`${API}/products?limit=1`);
  const body = await res.json();
  const product = body.items?.[0];
  if (!product?.slug) {
    process.stdout.write('No products found — start dev + run `npm run seed` first.\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  currentPage = page;
  page.on('response', (r) => {
    if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url().replace(WEB, '')}`);
  });

  await journey('guest: browse → size → cart → checkout → place order', async () => {
    await page.goto(`${WEB}/products/${product.slug}`);
    await page.getByRole('button', { name: 'Add to Cart' }).waitFor({ timeout: 15000 });
    ok('PDP renders with Add to Cart');
    await page.locator('[role="radio"]:not([disabled])').first().click();
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    ok('size selected + Add to Cart clicked');

    await page.goto(`${WEB}/cart`);
    await page.getByRole('link', { name: /Proceed to Checkout/ }).waitFor({ timeout: 15000 });
    check(
      await page.getByText(product.name).first().isVisible(),
      'cart shows the added product',
      product.name.slice(0, 40)
    );
    await page.getByRole('link', { name: /Proceed to Checkout/ }).click();
    await page.waitForURL(/\/checkout/, { timeout: 15000 });
    ok('Proceed to Checkout navigates');

    await page.getByLabel('Full name').fill('Guest Buyer');
    await page.getByLabel('Mobile number').fill(PHONE);
    await page.getByLabel('Address line', { exact: true }).fill('House 1, Test Street');
    await page.getByLabel('City', { exact: true }).fill('Lahore');
    const province = page.getByLabel(/Province/i);
    if ((await province.count()) > 0) await province.selectOption({ index: 1 });
    else await page.locator('select').first().selectOption({ index: 1 });
    const emailField = page.getByLabel(/Email/i);
    if ((await emailField.count()) > 0) await emailField.first().fill(EMAIL);
    ok('guest checkout form filled (COD, no account)');

    await page.getByRole('button', { name: /Place Order/ }).click();
    try {
      await page.waitForURL(/\/order-confirmation\//, { timeout: 25000 });
    } catch {
      const errs = await page.locator('form .text-red-700, form .text-red-600').allTextContents();
      bad(
        'place order navigated to confirmation',
        `still on checkout; field errors=[${errs.join(' | ')}]`
      );
      throw new Error(`no navigation; field errors: ${errs.join(' | ') || 'none visible'}`);
    }
    orderNumber = decodeURIComponent(new URL(page.url()).pathname.split('/').pop());
    check(/^SIS-\d{4}-\d+$/.test(orderNumber), 'guest order placed', orderNumber);
  });

  await journey('confirmation + track order', async () => {
    await page.waitForTimeout(600);
    const html = await page.content();
    check(!!orderNumber && html.includes(orderNumber), 'confirmation page shows the order number');
    await page.goto(`${WEB}/track-order`);
    await page.getByLabel('Order number').fill(orderNumber);
    await page.getByLabel('Mobile number').fill(PHONE);
    await page.getByRole('button', { name: /Track Order/ }).click();
    await page.getByText(orderNumber, { exact: true }).first().waitFor({ timeout: 15000 });
    ok('track-order finds the guest order');
    check(
      await page.getByText(product.name).first().isVisible(),
      'track result lists the ordered items',
      product.name.slice(0, 40)
    );
  });

  await journey('register: create account → verify email', async () => {
    await page.context().clearCookies();
    await page.goto(`${WEB}/register`);
    await page.getByLabel('Full name').fill(NAME);
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Mobile number').fill(PHONE);
    await page.getByLabel('Password', { exact: true }).fill(PASS);
    await page.getByLabel('Confirm password', { exact: true }).fill(PASS);
    const regResp = page.waitForResponse(
      (r) => r.url().includes('/auth/register') && r.status() === 201,
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /Create Account/ }).click();
    await page.waitForURL(/\/verify-email/, { timeout: 15000 });
    ok('register redirects to email verification');
    const code = (await (await regResp).json())?.dev?.otp;
    check(/^\d{6}$/.test(String(code || '')), 'otp delivered by register API', String(code));
    check(
      !page.url().includes('devOtp'),
      'otp never shown in the URL',
      page.url().replace(WEB, '')
    );
    await page.getByLabel('Verification code').fill(String(code));
    await page.getByRole('button', { name: /Verify Email/ }).click();
    await page.waitForURL(`${WEB}/`, { timeout: 15000 });
    ok('email verified → auto signed in → home');
    check(await waitForCookie(page, 'sis_jwt', true), 'verification sets the session cookie');
  });

  await journey('sign in + account + sign out + sign in', async () => {
    await page.context().clearCookies();
    check(await signIn(page, EMAIL, PASS), 'sign in with the new account');
    await page.goto(`${WEB}/account`);
    await page
      .getByText(/Hello, E2E/)
      .first()
      .waitFor({ timeout: 15000 });
    ok('account page shows the signed-in user');
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    check(await waitForCookie(page, 'sis_jwt', false), 'sign out clears the session');
    check(await signIn(page, EMAIL, PASS), 'sign in again with the same account');
  });

  await journey('forgot password → code → reset → sign in', async () => {
    await page.context().clearCookies();
    await page.goto(`${WEB}/forgot-password`);
    await page.getByPlaceholder('you@example.com').fill(EMAIL);
    await page.getByRole('button', { name: /Send reset code/ }).click();
    await page.getByText('Reset code').first().waitFor({ timeout: 15000 });
    const code =
      (
        await page
          .getByText(/^\d{6}$/)
          .first()
          .textContent()
      )?.trim() || '';
    check(/^\d{6}$/.test(code), 'reset code shown in dev mode');

    await page.goto(`${WEB}/reset-password?email=${encodeURIComponent(EMAIL)}`);
    await page.getByPlaceholder('123456').fill(code);
    await page.getByPlaceholder('At least 8 characters').fill(PASS2);
    await page.getByPlaceholder('Repeat password').fill(PASS2);
    await page.getByRole('button', { name: /Reset password/ }).click();
    await page
      .getByText(/Password updated/i)
      .first()
      .waitFor({ timeout: 15000 });
    ok('password reset completed (success panel shown)');
    check(await signIn(page, EMAIL, PASS2), 'sign in with the reset password');
  });

  await journey('contact form', async () => {
    await page.goto(`${WEB}/contact`);
    await page.getByPlaceholder('Your name').fill('E2E Contact');
    await page.getByPlaceholder('you@example.com').fill(EMAIL);
    await page.getByPlaceholder('How can we help?').fill(`E2E message ${stamp}`);
    await page.locator('form button[type="submit"]').first().click();
    await page
      .getByText(/Thanks|back to you soon/i)
      .first()
      .waitFor({ timeout: 15000 });
    ok('contact form submits and confirms');
  });

  await journey('admin: open order → confirm status', async () => {
    await page.context().clearCookies();
    check(await signIn(page, 'admin@sis.pk', 'Admin@SIS2026'), 'admin signs in');
    await page.waitForURL((u) => u.pathname === '/admin', { timeout: 12000 });
    await page.goto(`${WEB}/admin/orders`);
    const row = page.getByRole('link', { name: orderNumber }).first();
    await row.waitFor({ timeout: 15000 });
    ok('orders list shows the new order');
    await row.click();
    await page.waitForURL(/\/admin\/orders\/[a-f0-9]+/, { timeout: 15000 });
    await page.getByRole('button', { name: 'Mark confirmed' }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await page.getByRole('button', { name: 'Mark shipped' }).waitFor({ timeout: 15000 });
    ok('Placed → Confirmed transition applied via dialog');
  });

  await browser.close();

  process.stdout.write('');
  process.stdout.write(`\n========== E2E: ${passed} passed, ${failed} failed ==========\n`);
  if (failures.length) {
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`));
    process.exit(1);
  }
}

main().catch((err) => {
  process.stdout.write(`E2E CRASH: ${err.message}\n`);
  process.exit(1);
});
