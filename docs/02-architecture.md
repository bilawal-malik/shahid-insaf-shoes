# 02 — Architecture

**Project:** SIS — Shahid Insaf Shoes
**Pattern:** Two-app monorepo — Next.js storefront/admin on **Vercel**, Express API on **Railway**

---

## 1. Top-level decision: why not a Next.js monolith?

| Option                           | Pros                                                                                                              | Cons                                                                                                   | Verdict      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------ |
| **A. Next.js only** (API routes) | One deploy                                                                                                        | Vercel serverless = cold starts, DB connection churn, limited background jobs, harder payment webhooks | ✗            |
| **B. Next.js web + Express API** | Matches Railway+Vercel plan; long-running API = stable Mongo pooling, easy queue/cron/email later; clear contract | Two deploys, CORS/cookies to plan carefully                                                            | ✓ **CHOSEN** |
| **C. Everything on Railway**     | One host                                                                                                          | Loses Vercel edge/CDN/ISR speed & zero-config Next hosting                                             | ✗            |

**Decision:** Option B.

```
                        ┌────────────────────────────────────┐
   Browser ───────────► │  Vercel — Next.js (apps/web)       │
      │                 │  • Storefront (SSR/ISR)            │
      │  same-origin    │  • Admin UI (client-heavy)         │
      └───────────────► │  • BFF proxy route → API (cookies) │
                        └───────────────┬────────────────────┘
                                        │ internal fetch (server)
                                        │ + direct fetch (admin, token header)
                                        ▼
                        ┌────────────────────────────────────┐
                        │  Railway — Express API (apps/api)  │
                        │  • REST /api/v1                    │
                        │  • JWT auth                        │
                        │  • Business rules, stock, totals   │
                        └───────────────┬────────────────────┘
                                        │ Mongoose
                                        ▼
                        ┌────────────────────────────────────┐
                        │  MongoDB Atlas (or Railway Mongo)  │
                        └────────────────────────────────────┘
   Images: Cloudinary (upload from admin, CDN delivery)
```

### Cookie/auth strategy (important detail)

- **Storefront (guest/customer):** all API calls go through Next.js **server-side fetches** (Server Components / Route Handlers) → browser never talks to Railway directly → no CORS issues for public data.
- **Auth:** JWT stored in **httpOnly, SameSite=Lax cookie**. Checkout/account requests are proxied through Next.js Route Handlers (`/api/proxy/*`) which forward the cookie to Express as `Authorization: Bearer`. Same-site = no cross-site cookie pain.
- **Admin:** the admin UI can also call Express directly with the cookie forwarded as a bearer token set after login (the login itself goes through the Next.js proxy). Simplest v1: **everything goes through the Next.js proxy** — one origin, zero CORS config, only `VERCEL` server needs `API_URL`.
- Express sets `Access-Control-Allow-Origin` anyway (for future direct integrations / webhook receivers), with credentials.

**Result:** only the Next.js server needs to know `API_URL`; browsers only ever see `yourdomain.com`.

---

## 2. Tech stack

### Frontend — `apps/web`

| Concern        | Choice                                                                         | Notes                                            |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| Framework      | **Next.js 16 (App Router)**, JavaScript (no TS)                                | Server Components for SEO pages; Turbopack build |
| Styling        | **Tailwind CSS**                                                               | Light professional theme, custom tokens          |
| State          | React state + **Zustand** for cart                                             | Cart synced to localStorage/DB                   |
| Data fetching  | Server Components (direct API fetch) + small client fetch for interactive bits | Route Handlers as proxy                          |
| Forms          | Controlled components + tiny helpers                                           | No heavy form lib in v1                          |
| Icons          | lucide-react                                                                   |                                                  |
| Charts (admin) | recharts                                                                       | lightweight, responsive                          |
| Images         | next/image → Cloudinary loader                                                 | responsive `srcset`                              |

### Backend — `apps/api`

| Concern       | Choice                                                       | Notes                                    |
| ------------- | ------------------------------------------------------------ | ---------------------------------------- |
| Runtime       | Node.js 20 LTS                                               |                                          |
| Framework     | **Express 4**                                                |                                          |
| DB            | **MongoDB** + **Mongoose 8**                                 |                                          |
| Validation    | zod (preferred) or express-validator                         | request body/params validation           |
| Auth          | jsonwebtoken + bcryptjs                                      | JWT 7d access, httpOnly cookie via proxy |
| Uploads       | multer (memory) → Cloudinary SDK                             | admin product images                     |
| Config        | dotenv + single `config.js`                                  | fail-fast on missing env                 |
| Logging       | morgan (dev) / pino optional                                 |                                          |
| Errors        | central `errorHandler` middleware                            | ApiError class                           |
| Rate limiting | express-rate-limit on auth + checkout                        | basic abuse protection                   |
| Security      | helmet, cors (credentialed), express-mongo-sanitize patterns |                                          |

### Shared

- **npm workspaces** monorepo (no turbo needed at this size; optional later)
- ESLint + Prettier at root, shared config
- EditorConfig for consistent style

### Environments

| Env         | Web (Vercel)                        | API (Railway)           | DB                   |
| ----------- | ----------------------------------- | ----------------------- | -------------------- |
| development | `localhost:3100`                    | `localhost:4100`        | Atlas dev DB / local |
| production  | `https://sispk.com` (custom domain) | `https://api.sispk.com` | Atlas prod DB        |

---

## 3. Monorepo folder structure

```
ecommerce/
├── docs/                      # this folder — source of truth
├── package.json               # npm workspaces: apps/*, root scripts
├── .eslintrc.mjs (flat: eslint.config.mjs) / .prettierrc
├── .gitignore
├── .env.example               # documents all env vars
│
├── apps/
│   ├── web/                   # Next.js 16 (JS)
│   │   ├── next.config.js      # image domains, headers, rewrites
│   │   ├── tailwind.config.js
│   │   ├── public/             # robots.txt, favicon, og defaults
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (store)/            # storefront route group
│   │       │   │   ├── page.jsx                    # home
│   │       │   │   ├── products/page.jsx           # all products
│   │       │   │   ├── products/[slug]/page.jsx    # PDP
│   │       │   │   ├── categories/[slug]/page.jsx  # category listing
│   │       │   │   ├── search/page.jsx
│   │       │   │   ├── cart/page.jsx
│   │       │   │   ├── checkout/page.jsx
│   │       │   │   ├── order-confirmation/[id]/page.jsx
│   │       │   │   ├── track-order/page.jsx
│   │       │   │   ├── account/...                 # profile, orders, addresses
│   │       │   │   ├── login/page.jsx  /register/page.jsx
│   │       │   │   └── (info)/about|contact|faq|shipping|returns|privacy|terms
│   │       │   ├── admin/                          # protected group
│   │       │   │   ├── layout.jsx                  # sidebar shell
│   │       │   │   ├── page.jsx                    # dashboard
│   │       │   │   ├── products/...  categories/...
│   │       │   │   ├── orders/...    customers/...
│   │       │   │   ├── settings/  reports/
│   │       │   └── api/
│   │       │       └── proxy/[...path]/route.js    # forwards to Express + cookie
│   │       ├── components/
│   │       │   ├── ui/            # Button, Input, Modal, Badge, Table, Skeleton
│   │       │   ├── store/         # Header, Footer, ProductCard, Filters, CartDrawer
│   │       │   └── admin/         # Sidebar, StatCard, OrderTimeline, ...
│   │       ├── lib/               # api client, formatters, constants
│   │       ├── store/             # zustand cart store
│   │       └── styles/
│   │
│   └── api/                     # Express server
│       ├── src/
│       │   ├── server.js        # bootstrap
│       │   ├── app.js           # express app (exported for tests)
│       │   ├── config/          # env, db, constants
│       │   ├── models/          # Mongoose schemas
│       │   ├── routes/          # route modules → mounted at /api/v1
│       │   ├── controllers/     # request handlers
│       │   ├── services/        # business logic (orderService, stockService...)
│       │   ├── middlewares/     # auth, validate, errorHandler, rateLimit
│       │   ├── utils/           # ApiError, asyncHandler, slugify, pagination
│       │   └── seed/            # seed script (admin + sample catalogue)
│       └── package.json
│
└── .github/workflows/          # optional CI: lint on PR
```

**Layering rule (api):** `route → controller → service → model`. Controllers parse/validate; services hold business rules (totals, status transitions, stock); models are schemas only.

---

## 4. Key flows

### 4.1 Render product page (SEO-critical)

1. Google/user hits `/products/peshawari-chappal-black` on Vercel
2. Next.js Server Component fetches `API_URL/products/slug?...` **server-side**
3. Express → Mongo, returns product + JSON-LD data
4. Next renders full HTML + metadata; `Cache-Control: s-maxage` / ISR revalidate ~60s
5. Images served via Cloudinary through `next/image`

### 4.2 Place COD order

1. Client POSTs cart + address to `/api/proxy/orders` (same origin)
2. Proxy forwards to Express `POST /api/v1/orders` (attaches user JWT if cookie present)
3. Express order service (in a transaction-ish sequence):
   - validate payload, re-fetch products/prices server-side (never trust client prices)
   - verify each variant has stock
   - compute shipping from `Config`
   - decrement stock, create order with `payment.method=cod`, `status=placed`
   - append status history
4. Return order number → redirect to `/order-confirmation/[id]`
5. Stock restore if later cancelled/returned (admin action)

### 4.3 Admin updates order status

1. Admin UI → proxy → `PATCH /api/v1/orders/:id/status`
2. Express `orderService.transition()` checks allowed transition map (section 5 of 01), appends history, handles stock restore rules
3. UI refetches / optimistically updates timeline

### 4.4 Auth

- `POST /auth/login` (admin or customer by collection lookup) → proxy sets httpOnly cookie `sis_jwt`
- `GET /auth/me` on layout load → guards `/admin` and `/account`
- Admin layout: no cookie or non-admin claim → redirect `/login?next=/admin`

---

## 5. Cross-cutting concerns

| Concern          | Approach                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| Config/env       | Server-side only secrets in Railway/Vercel; `.env.example` at root documents all        |
| Validation       | zod schemas shared per route; 400 with field errors                                     |
| Errors           | `ApiError(status, message)`; central handler → `{ error: { message, code } }`           |
| Pagination       | `?page=&limit=` → `{ items, page, limit, total, pages }` (all list endpoints)           |
| Money            | numbers in PKR with 2 decimals; never float-sum critical paths (use rounding util)      |
| Slugs            | auto from name, uniqueness suffix `-2`, editable in admin                               |
| IDs              | Mongo ObjectId; public order number = human-friendly (`SIS-2026-00042`) alongside `_id` |
| Rate limit       | 10/min on login & order create                                                          |
| Time             | store UTC ISO; admin displays Asia/Karachi                                              |
| Logging          | request id + method/path/status/ ms                                                     |
| Versioning       | all routes under `/api/v1`                                                              |
| CORS             | credentialed allowlist (web origin); primary path is proxy anyway                       |
| Security headers | helmet on API; next.config security headers on web                                      |

---

## 6. Technology versions (pin at install)

- Node 20/22 LTS
- next `16.x` (Turbopack), react `19.x`, tailwindcss `3.4`
- express `4.x`, mongoose `8.x`, jsonwebtoken `9.x`, bcryptjs `2.x`, zod `4.x`, cloudinary `2.x`, multer `2.x`
- eslint `9.x` (flat config `eslint.config.mjs`) + eslint-config-next `16.x`, prettier `3.x`
- zustand `5.x`, recharts `2.x`, lucide-react `1.x`

_Exact versions pinned in root lockfile._

> **Why not ESLint 10:** released recently, but `eslint-plugin-react` / `eslint-plugin-jsx-a11y` / `eslint-plugin-import` peers still cap at `^9`. Downgrade to 9 until ecosystem catches up.
>
> **Why Next 16 (not 14):** Next 14 line carries multiple critical advisories (DoS, cache poisoning, Windows RCE). Chosen at Phase 0 while codebase was empty — zero migration cost.

---

## 7. Local development

```bash
# 1. install
npm install                      # workspaces

# 2. env
cp .env.example .env             # fill Mongo URI, JWT secret, Cloudinary
# (apps/api/.env and apps/web/.env.local already seeded for dev)

# 3. run both (root script)
npm run dev                      # concurrently: web:3100 + api:4100

# 4. seed (available from Phase 1)
npm run seed -w apps/api         # admin user + sample products/categories
```

- Dev ports: **web `:3100`, api `:4100`** (3000/4000 commonly occupied on the dev machine).
- Browser → API goes through the Next.js proxy route handler `app/api/proxy/[...path]` (forwards httpOnly `sis_jwt` cookie as Bearer). Server Components fetch Express directly via `API_URL`.
- An extra rewrite `/backend/:path*` → API exists in `next.config.js` for ad-hoc server-side passthrough if needed.
