/**
 * API smoke test — run against a live dev server:
 *   1. npm run dev -w apps/api   (or root npm run dev)
 *   2. npm run smoke -w apps/api
 */
const BASE = process.env.SMOKE_BASE || 'http://localhost:4100/api/v1';
let passed = 0;
let failed = 0;
const failures = [];

async function call(method, path, { body, token, expect = 200, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = raw ? null : await res.json().catch(() => null);
  const ok = res.status === expect;
  if (ok) {
    passed += 1;
    console.log(`  ok   ${method} ${path} -> ${res.status}`);
  } else {
    failed += 1;
    failures.push(`${method} ${path} expected ${expect} got ${res.status}`);
    console.log(`  FAIL ${method} ${path} -> ${res.status}`, JSON.stringify(data).slice(0, 200));
  }
  return { status: res.status, data };
}

async function main() {
  const stamp = Date.now();

  console.log('--- health & meta');
  await call('GET', '/', { expect: 200 });

  console.log('--- public config');
  const cfg = await call('GET', '/config');
  if (cfg.data?.shipping?.flatRate !== 250) {
    failed += 1;
    failures.push(`config flatRate expected 250 got ${cfg.data?.shipping?.flatRate}`);
  }

  console.log('--- categories');
  const cats = await call('GET', '/categories');
  if (!Array.isArray(cats.data?.items) || cats.data.items.length < 3) {
    failed += 1;
    failures.push('categories tree missing roots');
  }
  await call('GET', '/categories/sandals');
  await call('GET', '/categories/nope-does-not-exist', { expect: 404 });

  console.log('--- products');
  const prods = await call('GET', '/products?limit=5');
  const items = prods.data?.items || [];
  if (prods.data?.total !== 12) {
    failed += 1;
    failures.push(`products total expected 12 got ${prods.data?.total}`);
  }
  await call('GET', '/products?category=sandals&sort=price_asc');
  await call('GET', '/products?featured=true');
  await call('GET', '/products?minPrice=2000&maxPrice=4000');
  await call('GET', '/products/featured');
  await call('GET', '/products/new-arrivals');
  await call('GET', '/products/no-such-product', { expect: 404 });
  if (items.length) {
    const slug = items[0].slug;
    const pdp = await call('GET', `/products/${slug}`);
    if (!pdp.data?.product?._id) {
      failed += 1;
      failures.push('PDP missing product');
    }
    if (!Array.isArray(pdp.data?.related)) {
      failed += 1;
      failures.push('PDP missing related[]');
    }
  }

  console.log('--- search');
  const search = await call('GET', '/search?q=peshawari');
  if (!search.data?.items?.length) {
    failed += 1;
    failures.push('search q=peshawari returned nothing');
  }

  console.log('--- auth: register/login/me');
  const email = `smoke+${stamp}@test.dev`;
  const reg = await call('POST', '/auth/register', {
    body: { name: 'Smoke Tester', email, phone: '03001234567', password: 'Smoke@1234' },
    expect: 201,
  });
  const regToken = reg.data?.token;

  await call('POST', '/auth/register', {
    body: { name: 'Bad', email: 'not-an-email', phone: '123', password: 'x' },
    expect: 400,
  });

  const login = await call('POST', '/auth/login', {
    body: { email, password: 'Smoke@1234' },
  });
  const token = login.data?.token || regToken;
  if (!token) failures.push('no token from login');

  await call('GET', '/auth/me', { token });
  await call('PATCH', '/auth/me', { token, body: { name: 'Smoke Tester Updated' } });
  await call('PATCH', '/auth/me/password', {
    token,
    body: { currentPassword: 'Smoke@1234', newPassword: 'Smoke@9999' },
  });
  await call('POST', '/auth/login', { body: { email, password: 'Smoke@9999' } });
  await call('GET', '/auth/me', { expect: 401 });

  console.log('--- auth: guards');
  const adminLogin = await call('POST', '/auth/login', {
    body: { email: 'admin@sis.pk', password: 'Admin@SIS2026' },
  });
  const adminToken = adminLogin.data?.token;
  await call('GET', '/auth/admin-check', { token: adminToken });
  await call('GET', '/auth/admin-check', { token, expect: 403 });
  await call('GET', '/auth/admin-check', { expect: 401 });

  console.log('');
  console.log(`========== SMOKE: ${passed} passed, ${failed} failed ==========`);
  if (failures.length) {
    failures.forEach((f) => console.log(`  ✗ ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('SMOKE CRASH:', err.message);
  process.exit(1);
});
