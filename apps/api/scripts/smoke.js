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

  console.log('--- auth: addresses');
  await call('PATCH', '/auth/me', {
    token,
    body: {
      addresses: [
        {
          label: 'Home',
          fullName: 'Smoke Tester',
          phone: '03001234567',
          line1: 'Street 1, Block A',
          city: 'Lahore',
          province: 'Punjab',
          isDefault: true,
        },
      ],
    },
  });

  console.log('--- carts');
  let firstVariant = null;
  let conflictVariant = null;
  if (items.length) {
    const pdp2 = await call('GET', `/products/${items[0].slug}`);
    const variants = pdp2.data?.product?.variants || [];
    firstVariant = variants.find((v) => v.stock >= 2) || variants.find((v) => v.stock > 0) || null;
    conflictVariant = variants.find((v) => v.stock > 0 && v.stock < 20) || null;
  }
  if (firstVariant) {
    const vId = firstVariant._id;
    const pId = items[0]._id;
    const add = await call('POST', '/carts/me/items', {
      token,
      body: { product: pId, variant: vId, qty: 1 },
      expect: 201,
    });
    if (add.data?.items?.length !== 1) failures.push('cart add did not return 1 item');
    if (conflictVariant) {
      await call('POST', '/carts/me/items', {
        token,
        body: { product: pId, variant: conflictVariant._id, qty: conflictVariant.stock + 1 },
        expect: 409,
      });
    }
    await call('PATCH', `/carts/me/items/${vId}`, { token, body: { qty: 0 } });
    await call('POST', '/carts/me/items', {
      token,
      body: { product: pId, variant: vId, qty: 1 },
      expect: 201,
    });
    await call('DELETE', `/carts/me/items/${vId}`, { token });
    await call('DELETE', '/carts/me', { token });
    await call('GET', '/carts/me', { expect: 401 });
  }

  console.log('--- orders: guest COD flow');
  let guestOrder = null;
  if (firstVariant && items.length) {
    const price = firstVariant.priceOverride ?? items[0].price;
    const shipping = cfg.data?.shipping || {};
    await call('POST', '/orders', {
      body: {
        customer: { name: 'Smoke', phone: '123', email: 'bad' },
        shippingAddress: { fullName: 'Smoke', phone: '123', line1: 'x', city: 'Lahore', province: 'Punjab' },
        items: [{ product: items[0]._id, variant: firstVariant._id, qty: 1 }],
      },
      expect: 400,
    });

    const placed = await call('POST', '/orders', {
      body: {
        customer: { name: 'Smoke Buyer', phone: '03001234567', email: 'smoke.buyer@test.dev' },
        shippingAddress: {
          fullName: 'Smoke Buyer',
          phone: '03001234567',
          line1: 'Street 1, Block A',
          city: 'Lahore',
          province: 'Punjab',
        },
        items: [{ product: items[0]._id, variant: firstVariant._id, qty: 1 }],
      },
      expect: 201,
    });
    guestOrder = placed.data?.order;
    if (!guestOrder?.orderNumber) {
      failures.push('guest order missing orderNumber');
    } else {
      const freeAbove = Number(shipping.freeAbove) > 0 ? Number(shipping.freeAbove) : Infinity;
      const expectedShip = price >= freeAbove ? 0 : shipping.flatRate;
      const expectedTotal = price + expectedShip;
      if (guestOrder.pricing.total !== expectedTotal) {
        failures.push(`order total expected ${expectedTotal} got ${guestOrder.pricing.total}`);
      }

      await call(
        'GET',
        `/orders/lookup?orderNumber=${guestOrder.orderNumber}&phone=03001234567`
      );
      await call(
        'GET',
        `/orders/lookup?orderNumber=${guestOrder.orderNumber}&phone=03000000000`,
        { expect: 404 }
      );
    }
    await call('GET', '/orders/lookup?orderNumber=BAD&phone=123', { expect: 400 });
  }

  console.log('--- orders: account flow');
  if (firstVariant && items.length && token) {
    const placed = await call('POST', '/orders', {
      token,
      body: {
        customer: { name: 'Smoke Tester', phone: '03001234567', email },
        shippingAddress: {
          fullName: 'Smoke Tester',
          phone: '03001234567',
          line1: 'Street 1, Block A',
          city: 'Lahore',
          province: 'Punjab',
        },
        items: [{ product: items[0]._id, variant: firstVariant._id, qty: 1 }],
      },
      expect: 201,
    });
    const userOrder = placed.data?.order;
    if (userOrder && !userOrder.user) failures.push('account order missing user link');

    const mine = await call('GET', '/orders/me?page=1', { token });
    if (!mine.data?.items?.length) failures.push('orders/me returned no orders');
    if (userOrder) {
      await call('GET', `/orders/me/${userOrder._id}`, { token });
    }
    await call('GET', '/orders/me/000000000000000000000000', { token, expect: 404 });
    await call('GET', '/orders/me', { expect: 401 });
    await call('GET', '/orders/me/000000000000000000000000', { expect: 401 });
  }

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
