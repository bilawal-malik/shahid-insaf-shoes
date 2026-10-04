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

async function dbCleanup() {
  const target = process.env.SMOKE_BASE || '';
  if (target && !/localhost|127\.0\.0\.1/.test(target)) return; // remote target: local DB is not the one polluted
  try {
    await import('dotenv/config');
    const { connectDB, disconnectDB } = await import('../src/config/db.js');
    await connectDB();
    const [
      { default: User },
      { default: Product },
      { default: Category },
      { default: Order },
      { default: ContactMessage },
      { default: Cart },
    ] = await Promise.all([
      import('../src/models/User.js'),
      import('../src/models/Product.js'),
      import('../src/models/Category.js'),
      import('../src/models/Order.js'),
      import('../src/models/ContactMessage.js'),
      import('../src/models/Cart.js'),
    ]);

    const smokeUsers = await User.find({ email: /^smoke\+/ }).select('_id');
    const userIds = smokeUsers.map((u) => u._id);

    const [users, products, categories, orders, contacts, carts] = await Promise.all([
      User.deleteMany({ _id: { $in: userIds } }),
      Product.deleteMany({ name: /^Smoke Admin Shoe \d+$/ }),
      Category.deleteMany({ name: /^Smoke (Cat|Child) \d+$/ }),
      Order.deleteMany({
        $or: [
          { 'customer.name': { $in: ['Smoke Buyer', 'Smoke Tester', 'Smoke Tester Updated'] } },
          { 'customer.email': { $regex: /@test\.dev$/ } },
          { 'items.name': { $regex: /^Smoke Admin Shoe/ } },
        ],
      }),
      ContactMessage.deleteMany({ email: 'smoke.contact@test.dev' }),
      Cart.deleteMany({ user: { $in: userIds } }),
    ]);

    const removed =
      users.deletedCount +
      products.deletedCount +
      categories.deletedCount +
      orders.deletedCount +
      contacts.deletedCount +
      carts.deletedCount;
    if (removed > 0) console.log(`  cleanup: removed ${removed} smoke artifacts from DB`);
    await disconnectDB();
  } catch (err) {
    console.log('  cleanup: skipped —', err.message);
  }
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
  const rootCatId = cats.data?.items?.[0]?._id;
  if (!rootCatId) failures.push('no root category id available for admin tests');
  await call('GET', '/categories/sandals');
  await call('GET', '/categories/nope-does-not-exist', { expect: 404 });

  console.log('--- products');
  const prods = await call('GET', '/products?limit=5');
  const items = prods.data?.items || [];
  if (!(prods.data?.total >= 12)) {
    failed += 1;
    failures.push(`products total expected >=12 got ${prods.data?.total}`);
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

  console.log('--- auth: register → verify email → login');
  const email = `smoke+${stamp}@test.dev`;
  const reg = await call('POST', '/auth/register', {
    body: { name: 'Smoke Tester', email, phone: '03001234567', password: 'Smoke@1234' },
    expect: 201,
  });
  const regOtp = reg.data?.dev?.otp;
  if (!reg.data?.requiresVerification) failures.push('register missing requiresVerification');
  if (!regOtp) failures.push('register missing dev otp');
  if (reg.data?.token) failures.push('register must not issue a token before verification');

  await call('POST', '/auth/register', {
    body: { name: 'Bad', email: 'not-an-email', phone: '123', password: 'x' },
    expect: 400,
  });

  await call('POST', '/auth/login', {
    body: { email, password: 'Smoke@1234' },
    expect: 403,
  });

  const resend = await call('POST', '/auth/resend-verification', { body: { email } });
  const otp = resend.data?.dev?.otp || regOtp;

  await call('POST', '/auth/verify-email', { body: { email, otp: '000000' }, expect: 400 });
  await call('POST', '/auth/verify-email', { body: { email, otp }, expect: 200 });
  await call('POST', '/auth/verify-email', {
    body: { email: 'ghost@smoke.test', otp },
    expect: 400,
  });

  const login = await call('POST', '/auth/login', {
    body: { email, password: 'Smoke@1234' },
  });
  const token = login.data?.token;
  if (!token) failures.push('no token from login');

  await call('GET', '/auth/me', { token });
  await call('PATCH', '/auth/me', { token, body: { name: 'Smoke Tester Updated' } });
  await call('PATCH', '/auth/me/password', {
    token,
    body: { currentPassword: 'Smoke@1234', newPassword: 'Smoke@9999' },
  });
  await call('POST', '/auth/login', { body: { email, password: 'Smoke@9999' } });
  await call('GET', '/auth/me', { expect: 401 });

  console.log('--- auth: forgot/reset password (dev OTP)');
  const fg = await call('POST', '/auth/forgot-password', { body: { email } });
  const devOtp = fg.data?.dev?.otp;
  if (!devOtp) {
    failed += 1;
    failures.push('forgot-password missing dev otp');
  } else {
    await call('POST', '/auth/reset-password', {
      body: { email, otp: '000000', newPassword: 'Smoke@7777' },
      expect: 400,
    });
    await call('POST', '/auth/reset-password', {
      body: { email, otp: devOtp, newPassword: 'Smoke@7777' },
    });
    await call('POST', '/auth/login', { body: { email, password: 'Smoke@7777' } });
  }
  await call('POST', '/auth/forgot-password', { body: { email: 'nobody@smoke.test' } });
  const fg2 = await call('POST', '/auth/forgot-password', { body: { email } });
  const resetToken = fg2.data?.dev?.resetUrl?.split('token=')[1];
  if (resetToken) {
    await call('POST', '/auth/reset-password', {
      body: { token: resetToken, newPassword: 'Smoke@9999' },
    });
  }

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
        shippingAddress: {
          fullName: 'Smoke',
          phone: '123',
          line1: 'x',
          city: 'Lahore',
          province: 'Punjab',
        },
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

      await call('GET', `/orders/lookup?orderNumber=${guestOrder.orderNumber}&phone=03001234567`);
      await call('GET', `/orders/lookup?orderNumber=${guestOrder.orderNumber}&phone=03000000000`, {
        expect: 404,
      });
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

  console.log('--- admin: dashboard');
  if (adminToken) {
    const dash = await call('GET', '/admin/dashboard', { token: adminToken });
    if (!dash.data?.kpi) {
      failed += 1;
      failures.push('dashboard missing kpi');
    }
    await call('GET', '/admin/dashboard', { token, expect: 403 });
    await call('GET', '/admin/dashboard', { expect: 401 });

    console.log('--- admin: product CRUD');
    const sku = `SMOKE-${stamp}`;
    const baseBody = {
      name: `Smoke Admin Shoe ${stamp}`,
      slug: `smoke-admin-shoe-${stamp}`,
      category: rootCatId,
      price: 2500,
      compareAtPrice: 3000,
      description: 'Smoke test admin product',
      status: 'active',
      images: [{ url: 'https://picsum.photos/900/900', alt: 'smoke', isPrimary: true }],
      variants: [{ size: '40', color: 'Black', sku, stock: 5, isActive: true }],
    };
    const created = await call('POST', '/admin/products', {
      token: adminToken,
      body: baseBody,
      expect: 201,
    });
    const pid = created.data?.product?._id;
    if (!pid) {
      failures.push('admin product create did not return id');
    } else {
      await call('POST', '/admin/products', {
        token: adminToken,
        body: { ...baseBody, name: `Dup ${stamp}`, slug: `dup-${stamp}` },
        expect: 409,
      });
      await call('GET', `/admin/products/${pid}`, { token: adminToken });

      const seen = await call(
        'GET',
        `/products?q=${encodeURIComponent(`Smoke Admin Shoe ${stamp}`)}`
      );
      if (!seen.data?.items?.some((i) => i._id === pid)) {
        failures.push('active admin product not visible on storefront');
      }

      await call('PUT', `/admin/products/${pid}`, {
        token: adminToken,
        body: {
          ...baseBody,
          variants: [
            {
              _id: created.data.product.variants[0]._id,
              size: '40',
              color: 'Black',
              sku,
              stock: 2,
            },
            { size: '41', color: 'Black', sku: `${sku}-41`, stock: 3, isActive: true },
          ],
        },
      });
      const afterUpdate = await call('GET', `/admin/products/${pid}`, { token: adminToken });
      if (afterUpdate.data?.product?.variants?.length !== 2) {
        failures.push(`variant sync expected 2 got ${afterUpdate.data?.product?.variants?.length}`);
      }

      await call('PATCH', `/admin/products/${pid}/quick`, {
        token: adminToken,
        body: { isFeatured: true },
      });
      await call('DELETE', `/admin/products/${pid}`, { token: adminToken });
      const hidden = await call(
        'GET',
        `/products?q=${encodeURIComponent(`Smoke Admin Shoe ${stamp}`)}`
      );
      if (hidden.data?.items?.some((i) => i._id === pid)) {
        failures.push('archived product still visible on storefront');
      }
      await call('POST', `/admin/products/${pid}/restore`, { token: adminToken });

      await call('GET', `/admin/products/${pid}`, { token, expect: 403 });
      await call('POST', '/admin/products', { expect: 401 });
    }

    console.log('--- admin: category guards');
    const c1 = await call('POST', '/admin/categories', {
      token: adminToken,
      body: { name: `Smoke Cat ${stamp}`, parent: rootCatId },
      expect: 201,
    });
    const c1id = c1.data?.category?._id;
    const c2 = await call('POST', '/admin/categories', {
      token: adminToken,
      body: { name: `Smoke Child ${stamp}`, parent: c1id },
      expect: 201,
    });
    const c2id = c2.data?.category?._id;
    if (c1id && c2id) {
      await call('PUT', `/admin/categories/${c1id}`, {
        token: adminToken,
        body: { name: `Smoke Cat ${stamp}`, parent: c2id },
        expect: 409,
      });
      await call('DELETE', `/admin/categories/${rootCatId}`, {
        token: adminToken,
        expect: 409,
      });
      await call('DELETE', `/admin/categories/${c2id}`, { token: adminToken });
      await call('DELETE', `/admin/categories/${c1id}`, { token: adminToken });
    }
    await call('POST', '/admin/categories', { token, expect: 403, body: { name: 'Nope' } });
    await call('POST', '/admin/categories', { expect: 401, body: { name: 'Nope' } });

    console.log('--- admin: orders lifecycle');
    const orderList = await call('GET', '/admin/orders?limit=5', { token: adminToken });
    if (!Array.isArray(orderList.data?.items)) failures.push('admin orders list missing items');
    const targetOrder = guestOrder?._id || orderList.data?.items?.[0]?._id;
    if (targetOrder) {
      const detail = await call('GET', `/admin/orders/${targetOrder}`, { token: adminToken });
      const allowed = detail.data?.order?.allowedTransitions || [];
      if (!Array.isArray(detail.data?.order?.statusHistory)) {
        failures.push('order detail missing statusHistory');
      }
      if (guestOrder?._id === targetOrder) {
        for (const s of ['confirmed', 'shipped', 'delivered']) {
          const r = await call('PATCH', `/admin/orders/${targetOrder}/status`, {
            token: adminToken,
            body: { status: s },
          });
          if (r.data?.order?.status !== s) failures.push(`transition to ${s} failed`);
        }
        const done = await call('GET', `/admin/orders/${targetOrder}`, { token: adminToken });
        if (done.data?.order?.payment?.status !== 'paid') {
          failures.push('delivered order payment not marked paid');
        }
        const back = await call('PATCH', `/admin/orders/${targetOrder}/status`, {
          token: adminToken,
          body: { status: 'placed' },
          expect: 400,
        });
        if (back.data?.error?.code !== 'INVALID_TRANSITION') {
          failures.push('invalid transition did not return INVALID_TRANSITION');
        }
      } else if (allowed.length) {
        const r = await call('PATCH', `/admin/orders/${targetOrder}/status`, {
          token: adminToken,
          body: { status: allowed[0] },
        });
        if (r.data?.order?.status !== allowed[0]) {
          failures.push(`transition to ${allowed[0]} failed`);
        }
      }
      const noted = await call('PATCH', `/admin/orders/${targetOrder}/note`, {
        token: adminToken,
        body: { internalNote: `smoke ${stamp}` },
      });
      if (noted.data?.order?.internalNote !== `smoke ${stamp}`) {
        failures.push('internal note not saved');
      }
      if (guestOrder?.orderNumber) {
        const found = await call(
          'GET',
          `/admin/orders?q=${encodeURIComponent(guestOrder.orderNumber)}`,
          { token: adminToken }
        );
        if (!found.data?.items?.some((o) => o._id === targetOrder)) {
          failures.push('admin order search by number missed the order');
        }
      }
      await call('GET', `/admin/orders/${'6abf667ededa5676f0ebaf0c'}`, {
        token: adminToken,
        expect: 404,
      });
    }
    await call('GET', '/admin/orders?status=placed&from=2020-01-01&to=2030-01-01', {
      token: adminToken,
    });
    await call('GET', '/admin/orders', { token, expect: 403 });
    await call('GET', '/admin/orders', { expect: 401 });

    console.log('--- admin: customers');
    const custList = await call('GET', '/admin/customers?limit=5', { token: adminToken });
    if (!Array.isArray(custList.data?.items)) failures.push('admin customers list missing items');
    const foundCust = await call('GET', `/admin/customers?q=${encodeURIComponent(email)}`, {
      token: adminToken,
    });
    const cid = foundCust.data?.items?.[0]?._id;
    if (cid) {
      const cust = await call('GET', `/admin/customers/${cid}`, { token: adminToken });
      if (!Array.isArray(cust.data?.orders)) failures.push('customer detail missing orders');
      const self = await call('GET', '/auth/me', { token: adminToken });
      const adminId = self.data?.user?._id;
      if (adminId) {
        await call('PATCH', `/admin/customers/${adminId}`, {
          token: adminToken,
          body: { isActive: false },
          expect: 400,
        });
      }
      await call('PATCH', `/admin/customers/${cid}`, {
        token: adminToken,
        body: { isActive: false },
      });
      await call('GET', '/auth/me', { token, expect: 403 });
      await call('PATCH', `/admin/customers/${cid}`, {
        token: adminToken,
        body: { isActive: true },
      });
      await call('GET', '/auth/me', { token });
    }
    await call('GET', '/admin/customers', { expect: 401 });

    console.log('--- admin: config');
    const cfgAdmin = await call('GET', '/admin/config', { token: adminToken });
    if (!cfgAdmin.data?.config?.shipping) failures.push('admin config missing shipping');
    const flat = cfgAdmin.data?.config?.shipping?.flatRate ?? 250;
    const saved = await call('PUT', '/admin/config', {
      token: adminToken,
      body: { shipping: { flatRate: flat } },
    });
    if (saved.data?.config?.shipping?.flatRate !== flat) {
      failures.push('config update did not persist flatRate');
    }
    const publicCfg = await call('GET', '/config');
    if (publicCfg.data?.shipping?.flatRate !== flat) {
      failures.push('public config not refreshed after admin update');
    }
    await call('PUT', '/admin/config', { token: adminToken, body: {}, expect: 400 });
    await call('PUT', '/admin/config', {
      token: adminToken,
      body: { shipping: { flatRate: -1 } },
      expect: 400,
    });
    await call('GET', '/admin/config', { expect: 401 });

    console.log('--- admin: reports');
    const sales = await call('GET', '/admin/reports/sales?from=2020-01-01&to=2030-01-01', {
      token: adminToken,
    });
    if (!(sales.data?.summary?.orders >= 1)) failures.push('reports sales missing orders');
    if (!Array.isArray(sales.data?.byDay)) failures.push('reports sales missing byDay');
    const top = await call('GET', '/admin/reports/top-products?limit=5', { token: adminToken });
    if (!Array.isArray(top.data?.items)) failures.push('reports top-products missing items');
    const csv = await call('GET', '/admin/reports/orders-csv', { token: adminToken, raw: true });
    if (csv.status !== 200) failures.push('orders csv export failed');
    await call('GET', '/admin/reports/sales?from=2030-01-01&to=2020-01-01', {
      token: adminToken,
      expect: 400,
    });
    await call('GET', '/admin/reports/sales', { token, expect: 403 });
    await call('GET', '/admin/reports/sales', { expect: 401 });

    console.log('--- mail: dev outbox + contact notification');
    await call('POST', '/contact', {
      body: {
        name: 'Smoke Contact',
        email: 'smoke.contact@test.dev',
        phone: '03001234567',
        message: `Smoke contact message ${stamp}`,
      },
      expect: 201,
    });
    await call('GET', '/admin/mail/outbox', { expect: 401 });
    await call('GET', '/admin/mail/outbox', { token, expect: 403 });

    const expect = (cond, msg) => {
      if (cond) passed += 1;
      else {
        failed += 1;
        failures.push(msg);
      }
    };

    // Fire-and-forget sends race the first read — poll (uncounted), then
    // take one counted snapshot.
    const readOutbox = async () => {
      const res = await fetch(`${BASE}/admin/mail/outbox`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) return [];
      const body = await res.json().catch(() => null);
      return body?.items || [];
    };
    const wanted = ['reset', 'order-placed', 'order-status', 'contact', 'verify'];
    let mails = [];
    for (let i = 0; i < 15; i += 1) {
      mails = await readOutbox();
      if (wanted.every((kind) => mails.some((m) => m.kind === kind))) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    const snapshot = await call('GET', '/admin/mail/outbox', { token: adminToken });
    mails = snapshot.data?.items || mails;

    const has = (kind) => mails.some((m) => m.kind === kind);
    expect(has('reset'), 'outbox missing password-reset email');
    expect(has('order-placed'), 'outbox missing order confirmation email');
    expect(has('order-status'), 'outbox missing order status email');
    expect(has('contact'), 'outbox missing contact notification');
    const reset = mails.find((m) => m.kind === 'reset');
    expect(reset?.to === email, `reset email targeted ${reset?.to}, expected ${email}`);
    expect(/reset/i.test(reset?.subject || ''), 'reset email subject missing "reset"');
    const placed = mails.find((m) => m.kind === 'order-placed');
    expect(
      String(placed?.text || '').includes('Cash on Delivery'),
      'order confirmation email missing COD text'
    );
    expect(
      mails.some((m) => m.kind === 'reset' && m.sent),
      'no reset email actually delivered to mail transport'
    );
  }

  console.log('');
  console.log(`========== SMOKE: ${passed} passed, ${failed} failed ==========`);
  await dbCleanup();
  if (failures.length) {
    failures.forEach((f) => console.log(`  ✗ ${f}`));
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('SMOKE CRASH:', err.message);
  await dbCleanup();
  process.exit(1);
});
