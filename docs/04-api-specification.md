# 04 — API Specification

**Base URL (prod):** `https://api.sispk.com/api/v1` · **Dev:** `http://localhost:4100/api/v1`
**Conventions**

- JSON in/out; `Content-Type: application/json`
- Auth via `Authorization: Bearer <jwt>` (browser path = Next.js proxy forwards httpOnly cookie)
- Success: resource → `200/201` with object/array directly (lists wrapped per pagination shape)
- Error shape: `{ "error": { "message": "Human readable", "code": "VALIDATION_ERROR", "fields?": { "email": "Invalid" } } }`
- Pagination query: `?page=1&limit=20&sort=...` → `{ items, page, limit, total, pages }`
- Rate limits marked 🔒 (general: 100 req/15min/IP; 🔒 tighter)

**Legend:** 🌐 public · 👤 customer · 🛡️ admin

---

## 1. Auth — `/auth`

| #   | Method & Path                | Access | Purpose                                                            |
| --- | ---------------------------- | ------ | ------------------------------------------------------------------ |
| 1.1 | `POST /auth/register`        | 🌐     | Create customer `{name, email, phone, password}` → `{user, token}` |
| 1.2 | `POST /auth/login` 🔒        | 🌐     | `{email, password}` → `{user, token}` — works for admin + customer |
| 1.3 | `POST /auth/logout`          | 👤     | Clears cookie (proxy) / client drops token                         |
| 1.4 | `GET /auth/me`               | 👤     | Current user profile (401 if none)                                 |
| 1.5 | `PATCH /auth/me`             | 👤     | Update `{name, phone, email}`                                      |
| 1.6 | `PATCH /auth/me/password` 🔒 | 👤     | `{currentPassword, newPassword}`                                   |
| 1.7 | `GET /auth/admin-check`      | 🛡️     | `{ ok: true }` if `role === 'admin'` — used by admin layout guard  |

**JWT payload:** `{ sub: userId, role, name }` · 7 days · httpOnly cookie `sis_jwt` set by Next proxy.

---

## 2. Public catalogue — `/products`, `/categories`, `/config`, `/search`

| #   | Method & Path                | Access | Purpose                                                                                                                                                                                     |
| --- | ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | `GET /products`              | 🌐     | List active products. Query: `page, limit (max 48), category (slug), sort (newest\|price_asc\|price_desc\|popular), size, color, minPrice, maxPrice, featured (true), newArrival (true), q` |
| 2.2 | `GET /products/featured`     | 🌐     | ≤8 featured active (home)                                                                                                                                                                   |
| 2.3 | `GET /products/new-arrivals` | 🌐     | ≤8 `isNewArrival`                                                                                                                                                                           |
| 2.4 | `GET /products/:slug`        | 🌐     | Full product + category name + related (same category, 4)                                                                                                                                   |
| 2.5 | `GET /products/:id/related`  | 🌐     | Alternative related endpoint if needed                                                                                                                                                      |
| 2.6 | `GET /categories`            | 🌐     | Tree of active categories (+ product counts)                                                                                                                                                |
| 2.7 | `GET /categories/:slug`      | 🌐     | One category + breadcrumb ancestors                                                                                                                                                         |
| 2.8 | `GET /search?q=`             | 🌐     | Products by name/tag/category, `page,limit`                                                                                                                                                 |
| 2.9 | `GET /config`                | 🌐     | Public store config (shipping flat rate, freeAbove, phone, announcement) — **never secrets**                                                                                                |

**Product list item shape (public):**

```json
{
  "_id": "...",
  "name": "...",
  "slug": "...",
  "price": 2499,
  "compareAtPrice": 2999,
  "category": { "_id": "...", "name": "Sandals", "slug": "sandals" },
  "images": [{ "url": "...", "alt": "..." }],
  "primaryImage": { "url": "...", "alt": "..." },
  "totalStock": 23,
  "isFeatured": true,
  "isNewArrival": false,
  "soldCount": 14,
  "sizes": ["40", "41", "42", "43", "44"],
  "colors": ["Black", "Tan"],
  "discountPercent": 17
}
```

**PDP adds:** `description, images[], variants[] (size/color/stock/priceOverride), metaTitle, metaDescription, breadcrumbs[], related[]`.

---

## 3. Cart (logged-in only) — `/carts` 👤

| #   | Method & Path                       | Access | Purpose                                                       |
| --- | ----------------------------------- | ------ | ------------------------------------------------------------- |
| 3.1 | `GET /carts/me`                     | 👤     | Current cart w/ hydrated product info + live prices           |
| 3.2 | `POST /carts/me/items`              | 👤     | `{product, variant, qty}` → adds/increments (validates stock) |
| 3.3 | `PATCH /carts/me/items/:variantId`  | 👤     | `{qty}`                                                       |
| 3.4 | `DELETE /carts/me/items/:variantId` | 👤     | Remove line                                                   |
| 3.5 | `DELETE /carts/me`                  | 👤     | Clear cart                                                    |

> Guest cart = localStorage (Zustand persist). At login, client pushes guest lines to 3.2 one by one (merge).

---

## 4. Orders — `/orders`

| #   | Method & Path                            | Access | Purpose                                                |
| --- | ---------------------------------------- | ------ | ------------------------------------------------------ |
| 4.1 | `POST /orders` 🔒                        | 🌐/👤  | **Place COD order** (see body below) → `201 { order }` |
| 4.2 | `GET /orders/lookup?orderNumber=&phone=` | 🌐     | Public status + timeline (no full address)             |
| 4.3 | `GET /orders/me`                         | 👤     | Customer's order history (paginated)                   |
| 4.4 | `GET /orders/me/:id`                     | 👤     | Own order detail (ownership enforced)                  |

**4.1 request body:**

```json
{
  "isGuest": true,
  "customer": { "name": "Ali Khan", "phone": "03001234567", "email": "optional@x.com" },
  "shippingAddress": {
    "fullName": "...",
    "phone": "...",
    "line1": "...",
    "line2": "",
    "city": "Lahore",
    "province": "Punjab",
    "postalCode": ""
  },
  "items": [{ "product": "<productId>", "variant": "<variantId>", "qty": 2 }],
  "useSavedAddressId": null,
  "createAccount": { "password": "..." }
}
```

**Server:** ignores client prices → reads DB, computes pricing from `config.shipping`, validates stock, decrements, creates order. Response includes computed `pricing` and `orderNumber`.

**Errors:** `409 STOCK_UNAVAILABLE` with `{ conflicts: [{ variant, available }] }` → UI shows message + links back to cart.

---

## 5. Admin — `/admin/*` 🛡️ (all require `role=admin`)

### 5.1 Dashboard

| #     | Path                   | Purpose                                                                                                                                                                                                                |
| ----- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1.1 | `GET /admin/dashboard` | `{ kpi: { revenueToday, revenue7d, revenue30d, ordersToday, orders7d, orders30d, aov, pendingOrders }, salesChart: [{date, revenue, orders}] (14d), recentOrders: [5 orders], lowStock: [{product, variant, stock}] }` |

### 5.2 Products

| #     | Method & Path                      | Purpose                                                                                                           |
| ----- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 5.2.1 | `GET /admin/products`              | Full list incl. draft/archived. Query: `q, category, status, page, limit, sort`                                   |
| 5.2.2 | `POST /admin/products`             | Create (multipart or JSON w/ image URLs)                                                                          |
| 5.2.3 | `GET /admin/products/:id`          | Detail for edit form                                                                                              |
| 5.2.4 | `PUT /admin/products/:id`          | Full update (variants sync by `_id` when present, else add; missing → remove if unused by orders else deactivate) |
| 5.2.5 | `DELETE /admin/products/:id`       | Archive (soft) — 409 if attempted hard delete with order refs                                                     |
| 5.2.6 | `POST /admin/products/:id/restore` | archived → draft                                                                                                  |
| 5.2.7 | `PATCH /admin/products/:id/quick`  | `{ status?, isFeatured?, isNewArrival? }` toggle from list                                                        |

### 5.3 Media

| #     | Method & Path                    | Purpose                                                                                         |
| ----- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| 5.3.1 | `POST /admin/upload`             | `multipart/form-data` file → `{ url, publicId }` (Cloudinary) — used by product/category images |
| 5.3.2 | `DELETE /admin/upload/:publicId` | Remove asset (404-safe)                                                                         |

### 5.4 Categories

| #     | Method & Path                  | Purpose                                      |
| ----- | ------------------------------ | -------------------------------------------- |
| 5.4.1 | `GET /admin/categories`        | All (incl. inactive), with counts            |
| 5.4.2 | `POST /admin/categories`       | Create                                       |
| 5.4.3 | `PUT /admin/categories/:id`    | Update (parent change validated — no cycles) |
| 5.4.4 | `DELETE /admin/categories/:id` | 409 `HAS_PRODUCTS` / `HAS_CHILDREN`          |

### 5.5 Orders

| #     | Method & Path                        | Purpose                                                                    |
| ----- | ------------------------------------ | -------------------------------------------------------------------------- |
| 5.5.1 | `GET /admin/orders`                  | `q (number/phone/name), status, from, to, page, limit, sort`               |
| 5.5.2 | `GET /admin/orders/:id`              | Full detail: customer, items w/ images, pricing, history                   |
| 5.5.3 | `PATCH /admin/orders/:id/status`     | `{ status, note? }` — **validates transition map**; side-effects per 03 §4 |
| 5.5.4 | `PATCH /admin/orders/:id/note`       | `{ internalNote }`                                                         |
| 5.5.5 | `GET /admin/orders/:id/packing-slip` | Data for print view (or same as 5.5.2 with print layout client-side)       |

**Transition map (server-enforced):**

```js
{
  placed:    ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned:  []
}
```

Invalid → `400 INVALID_TRANSITION` with `{ allowed: [...] }`.

### 5.6 Customers

| #     | Method & Path                | Purpose                                                   |
| ----- | ---------------------------- | --------------------------------------------------------- |
| 5.6.1 | `GET /admin/customers`       | `q, page, limit` → + orderCount, totalSpent (aggregation) |
| 5.6.2 | `GET /admin/customers/:id`   | Profile + addresses + their orders                        |
| 5.6.3 | `PATCH /admin/customers/:id` | `{ isActive }` (block abuser)                             |

### 5.7 Config

| #     | Method & Path       | Purpose                                                                            |
| ----- | ------------------- | ---------------------------------------------------------------------------------- |
| 5.7.1 | `GET /admin/config` | Full config doc                                                                    |
| 5.7.2 | `PUT /admin/config` | Partial update of `store / shipping / checkout / announcement` → invalidates cache |

### 5.8 Reports

| #     | Method & Path                                        | Purpose                                                                       |
| ----- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| 5.8.1 | `GET /admin/reports/sales?from=&to=`                 | `{ summary: { revenue, orders, aov, units }, byDay: [...], byStatus: {...} }` |
| 5.8.2 | `GET /admin/reports/top-products?from=&to=&limit=10` | `[{ product, qty, revenue }]`                                                 |
| 5.8.3 | `GET /admin/reports/orders-csv?from=&to=`            | `text/csv` download                                                           |

---

## 6. Contact — `/contact`

| #   | Method & Path      | Access | Purpose                                                                                      |
| --- | ------------------ | ------ | -------------------------------------------------------------------------------------------- |
| 6.1 | `POST /contact` 🔒 | 🌐     | `{ name, email?, phone?, message }` → stores `ContactMessage` + (Phase 8) emails store inbox |

`ContactMessage` collection: `{ name, email, phone, message, createdAt, isRead }` — admin list optional in v1.1 (fallback: keep collection for now, UI later).

---

## 7. Health & ops

| #   | Path           | Purpose                                      |
| --- | -------------- | -------------------------------------------- |
| 7.1 | `GET /health`  | `{ ok: true, uptime }` (Railway healthcheck) |
| 7.2 | `GET /version` | `{ commit?, env }`                           |

---

## 8. Proxy contract (Next.js — not versioned)

```
ANY  /api/proxy/[...path]   →  ${API_URL}/api/v1/${path}
     • forwards method, body, query
     • attaches Authorization from sis_jwt cookie
     • sets/clears cookie when path is /auth/login|/auth/logout|/auth/register
     • caches GET /config, /products lightly via Next fetch revalidate
```

Public SSR data fetches call Express **directly from Server Components** (server-to-server, no cookie needed for 🌐 routes).

---

## 9. HTTP status map

| Code    | When                                                     |
| ------- | -------------------------------------------------------- |
| 200/201 | success                                                  |
| 400     | validation / invalid transition / bad query              |
| 401     | not authenticated                                        |
| 403     | authenticated but not admin                              |
| 404     | resource not found                                       |
| 409     | stock unavailable, duplicate slug/email, delete blocked  |
| 413     | upload too large (max 5MB/image)                         |
| 429     | rate limited                                             |
| 500     | unexpected (logged with stack, generic message to client |
