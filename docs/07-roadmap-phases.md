# 07 — Roadmap & Phases

**Principle:** docs first (done), then thin vertical slices that are always runnable. Each phase ends with a **working demo + updated status in `docs/README.md`**.

**Team note:** solo/small team, working at steady pace. Estimates are relative t-shirt sizes, not dates.

---

## Phase overview

| Phase | Name                             | Size | Outcome                                                   |
| ----- | -------------------------------- | ---- | --------------------------------------------------------- |
| P0    | Setup & docs                     | S    | Monorepo boots: `npm run dev` runs web+api, lint passes   |
| P1    | API foundation                   | M    | Models + auth + catalogue endpoints live on :4000         |
| P2    | Storefront browse                | M    | Home, category, PDP, search — SEO-ready SSR pages         |
| P3    | Cart → COD checkout              | M    | Real order lands in DB with correct pricing/stock         |
| P4    | Admin: auth + catalogue          | M    | Admin can CRUD products/categories with images            |
| P5    | Admin: orders + config + reports | M    | Full order lifecycle + shipping config + sales view       |
| P6    | SEO + performance pass           | S-M  | Lighthouse targets met, metadata/JSON-LD/sitemap complete |
| P7    | Production deployment            | S    | Live on custom domain, Railway + Vercel + Atlas           |
| P8    | Post-launch                      | —    | Email, online payments, polish backlog                    |

---

## P0 — Setup & docs ✅

**Goal:** zero-to-dev environment, conventions locked.

Tasks:

- [x] Create `docs/` (all 9 files)
- [x] Root: npm workspaces, ESLint 9 (flat config) + Prettier, `.gitignore`, `.env.example`, `.editorconfig`
- [x] `apps/web`: Next.js 16 (JS) + Tailwind scaffold, light theme tokens in `globals.css`
- [x] `apps/api`: Express scaffold (helmet, cors, morgan, errorHandler, `/health`, `/api/v1` mount)
- [x] Root scripts: `dev` (concurrently), `lint`, `build`
- [x] DB connection module + graceful shutdown (dev continues without Mongo; prod fails fast)
- [x] Initial git commit

> **Dev ports:** web `:3100`, api `:4100` (3000/4000 occupied on dev machine — kept in `.env` everywhere).

**Done when:** ✅ `npm run dev` → web **:3100** renders SIS home, api **:4100** `/health` returns ok, proxy `/api/proxy/*` passes through to API, `npm run lint` (0 warnings) + `npm run build` clean.
Remaining: initial git commit (on request).

---

## P1 — API foundation ✅

**Goal:** data layer + auth + public catalogue API complete (seeded).

Tasks:

- [x] Mongoose models (all 7 collections per doc 03) + indexes
- [x] `configService` w/ cache · `counterService` for order numbers
- [x] Seed script (admin, categories, products, demo orders, config) — idempotent, `--force` to wipe
- [x] Auth: register/login/logout/me/update/password/admin-check + JWT middleware + role guard
- [x] Email verification on register: 6-digit OTP (15-min, 5 attempts), `POST /auth/verify-email` + `/auth/resend-verification`, login blocked with 403 `EMAIL_NOT_VERIFIED` until verified, verify mail template
- [x] Public routes: products (list/filters/sort/pagination), product by slug (+related), categories tree, search, `/config`
- [x] Validation (zod 4) + central error handler + ApiError + rate limit on auth
- [x] Smoke tests: `npm run smoke -w apps/api` → **26/26 passing**
- [ ] Admin routes (list/CRUD) → moved to P4 (admin UI phase)

**Done when:** ✅ seed → filters/sort/pagination work; login returns token + httpOnly cookie through Next proxy; admin guard returns 401/403 correctly; smoke 26/26.

**Dev credentials (Atlas `sis_dev`):** admin `admin@sis.pk` / `Admin@SIS2026` (seed prints it — change for prod).

---

## P2 — Storefront browse ✅

**Goal:** beautiful, fast, indexable browsing experience.

Tasks:

- [x] Layout: Header (nav from categories, search, cart badge), Footer (from config), announcement bar
- [x] Home: hero, trust strip, category tiles, featured/new/popular sections (ISR)
- [x] `/products` grid + filters + sort + pagination (URL state)
- [x] Category page w/ breadcrumb + children chips
- [x] PDP: gallery, size/color select, price/discount, stock, related, accordions
- [x] Search page
- [x] Info pages (static content)
- [x] ProductCard, Skeletons, EmptyStates, toast system
- [x] API proxy route handlers for cookie-forwarding (auth prep)
- [x] `generateMetadata` everywhere + first pass JSON-LD (Product/Organization)

**Done when:** full browse flow on mobile + desktop, all pages SSR with unique titles, Lighthouse SEO ≥ 90 already.

---

## P3 — Cart & COD checkout ✅

**Goal:** a visitor can buy with cash on delivery.

Tasks:

- [x] Zustand cart (persist localStorage, hydration-safe) + Header badge + cart page
- [x] Add-to-cart with variant/stock validation; stock conflict handling (409 `STOCK_UNAVAILABLE` + `details.conflicts` → checkout banner)
- [x] Auth pages (login/register) + merge guest cart on login (`lib/cart-sync.js`)
- [x] Checkout page (contact/address/COD/review, PK phone validation, saved-address picker, create-account option, summary, 409 UX)
- [x] `POST /orders` service: server-side price recompute, shipping from config, atomic conditional stock decrement + rollback, order number `SIS-YYYY-NNNNN`, `statusHistory`, guest or account order, optional account creation, rate limit (`orderLimiter`)
- [x] Confirmation page (sessionStorage snapshot → `/track-order` fallback) + public track-order lookup (`GET /orders/lookup` + `StatusTracker`)
- [x] Account: profile (PATCH `/auth/me`), password change, orders list/detail (`GET /orders/me[/:id]`), address book CRUD (PATCH `/auth/me` with `addresses`, max 6, single default)
- [x] Smoke extended for carts + orders → **46/46 passing**

**Done when:** ✅ guest can place order end-to-end through the Next proxy (verified: `SIS-2026-00006/00007/00008/00010`); DB shows correct totals/stock; order visible via `/track-order` (wrong phone → 404); logged-in path + order isolation (foreign id → 401/404) verified; lint 0, build 21/21.

---

## P4 — Admin: auth + catalogue ✅

**Goal:** admin runs the catalogue without the DB.

Tasks:

- [x] Admin route guard (server-side cookie → `/auth/admin-check` in `app/admin/layout.jsx`; no token → `/login?next=/admin`, non-admin → `/`) + login redirect flow
- [x] Admin shell: sidebar, topbar, responsive drawer (P5 nav items present but disabled "soon")
- [x] Dashboard **data endpoint** (`/admin/dashboard` — KPIs today/7d/30d, AOV, 14-day sales chart, recent orders, low stock) + page with KPI cards, CSS bar chart (recharts stays P5)
- [x] Products list (debounced search/status/category filters, pagination, URL-friendly client state) + quick status/feature toggles
- [x] Product create/edit form: variants matrix (+bulk size/SKU generator), images upload via `/admin/upload` (local fallback now, Cloudinary when creds arrive) or URL, flags, SEO fields w/ Google preview, slug handling; variant sync on update (add/update/remove, order-referenced variants deactivate instead of delete)
- [x] Archive/restore (`DELETE`/`POST …/restore`, hidden from storefront when archived)
- [x] Categories tree CRUD with validation (cycle guard → `CYCLE` 409, `HAS_CHILDREN`/`HAS_PRODUCTS` delete guards) + Settings: admin profile + password (`app/admin/settings/profile`)
- [x] Uploads served from API `/uploads` (helmet `crossOriginResourcePolicy: cross-origin`); proxy passes multipart as binary (`arrayBuffer`); `next.config.js` allows localhost:4100 images + `dangerouslyAllowLocalIP` in dev
- [x] Smoke extended with admin section → **69/69 passing**

**Done when:** ✅ admin can create a product with 10 variants + 3 images and it appears on storefront (active) within refresh — verified via proxy (`e2e-p4-sandal`: 10 variants, 3 images, visible with image + 10 sizes); guard redirects verified (no cookie → `/login?next=/admin`, customer → `/`); `next/image` optimizer serves localhost:4100; lint 0, build 25/25.

---

## P5 — Admin: orders, config, sales ✅

**Goal:** full operations control.

Tasks:

- [x] Orders list (filters + URL state) + detail page — `app/admin/orders`, `app/admin/orders/[id]`
- [x] Status transition endpoint + timeline + confirm dialogs + stock restore rules + packing slip print CSS (`PATCH /admin/orders/:id/status`, `print:hidden` shell)
- [x] Internal notes (`PATCH /admin/orders/:id/note`, admin-only panel)
- [x] Dashboard complete: KPIs, 14-day chart (CSS bars — recharts skipped deliberately), recent orders, low-stock, status breakdown
- [x] Customers list/detail (+deactivate blocks login server-side via `isActive`)
- [x] Config editor (shipping flatRate/freeAbove/estimatedDays, store info, announcement, lowStock threshold) + cache invalidation — storefront reflects within ~60s (ISR `revalidate: 60`)
- [x] Reports: date-range summary + by-day chart + top products + CSV export (proxy → blob download)
- [x] Smoke extended with orders/customers/config/reports/mail → **123/123 passing**

**Done when:** ✅ full lifecycle Placed→Delivered exercised in smoke (transition map enforced, invalid → 400 `INVALID_TRANSITION`, cancel/return restores stock, delivered marks COD paid); `PUT /admin/config` flatRate round-trips to public `/config`; report summary matches order list; lint 0, build passing.

**Note:** wiring the four P5 controllers exposed pre-existing `../../` import paths (they had never been loaded) — fixed to `../`.

---

## P6 — SEO & performance pass

**Goal:** hit the numbers in doc 06.

Tasks:

- [x] Metadata audit per route map · canonical · robots · sitemap complete · OG images (default `public/og-default.png` + `icon.png`; product/category/home ship their own `og:image`)
- [x] JSON-LD complete (Organization/WebSite on home, Product + Breadcrumb on PDP, CollectionPage + Breadcrumb on category, FAQPage on `/faq`)
- [x] Utility routes noindex (`login`, `register`, `forgot/reset-password`, `track-order`, `order-confirmation` split into server `page.jsx` + client view) + robots.txt disallow list expanded
- [x] 404/403 + error handling UX (`not-found.jsx`, `app/error.jsx`, `app/global-error.jsx`)
- [ ] Content pass: category/product descriptions, alt text, About/FAQ copy (seed descriptions are placeholders)
- [ ] Image optimization audit (sizes, priority, aspect ratios)
- [ ] Suspense/parallel fetch, ISR tuning, no waterfall — home/category already `Promise.all` + `revalidate`; needs measurement
- [ ] Accessibility pass (keyboard, contrast, forms)
- [ ] Lighthouse mobile on home/PDP/category/checkout — fix until targets met (perf 90, SEO 95, a11y 90)
- [ ] Rich Results Test on PDP + FAQ

**Done when:** Lighthouse ≥ targets; Rich Results Test passes on PDP.

---

## P7 — Production deployment

**Goal:** live store on real domain.

Code/config side:

- [x] Railway config: root `railway.json` (Nixpacks, `npm ci` workspaces, start `npm run start -w apps/api`, healthcheck `/health`) — **Docker removed by decision; Vercel + Railway only**
- [x] `.github/workflows/ci.yml` — `npm ci` → lint → format:check → build on push/PR
- [x] Env vars documented (doc 08 §1); `.env.example` matches

Account/dashboard side (cannot be done from the repo):

- [ ] MongoDB Atlas production cluster + DB user + IP allowlist (0.0.0.0/0 for Vercel/Railway egress — document tradeoff; use Atlas App alternatives later if needed)
- [ ] Railway: deploy from GitHub (repo root — `railway.json` picks start command + `/health`), env vars (§1.1), generate `api.<domain>` subdomain
- [ ] Vercel: deploy `apps/web` (Root Directory = `apps/web`), env vars (`API_URL`), custom domain, apex/www decision
- [ ] Seed prod DB: `node apps/api/src/seed/index.js` with prod `MONGODB_URI` (admin + 24 products + 5 customers + 12 orders)
- [ ] Cloudinary prod account + upload presets env
- [ ] Seeds for prod (admin + real catalogue via admin UI)
- [ ] Post-launch verification checklist (below)
- [ ] Uptime monitor (UptimeRobot free) on `/health` + storefront
- [ ] Backups: Atlas M0 free daily backups noted; export plan

**Launch checklist:**

- [ ] HTTPS both services, apex redirect consistent
- [ ] Place test order on production → appears in admin → status flow works
- [ ] Shipping config edit works live
- [ ] Sitemap submitted to Search Console; GA4/Vercel Analytics live
- [ ] Contact phone/address correct everywhere
- [ ] 404s, speed, mobile test on real devices
- [ ] `docs/README.md` status updated

---

## P8 — Post-launch backlog (prioritized)

| Priority | Item                                | Notes                                                                                                                                                                                                    |
| -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | ~~Transactional email~~ ✅          | **Done pre-launch:** reset codes, order confirmation, status updates, contact + new-order alerts — `mailService.js` (Brevo REST or SMTP) + templates; dev outbox `GET /admin/mail/outbox`; smoke-covered |
| 2        | **Online payment integration**      | Design already ready: `payment.method/status`; gateway via Express (JazzCash/Easypaisa/Stripe- PK) — checkout step + webhook route + admin reconciliation                                                |
| 3        | Product reviews (simple, moderated) | `reviews` collection                                                                                                                                                                                     |
| 4        | Coupon codes                        | `coupons` collection + `pricing.discount` wiring                                                                                                                                                         |
| 5        | Wishlist                            |                                                                                                                                                                                                          |
| 6        | Abandoned cart emails               | needs 2+                                                                                                                                                                                                 |
| 7        | WhatsApp order share button         | quick win                                                                                                                                                                                                |
| 8        | Blog / size guide content           | SEO growth                                                                                                                                                                                               |
| 9        | Contact inbox in admin              | `ContactMessage` already collected                                                                                                                                                                       |
| 10       | Multi-admin + roles (RBAC)          | only if team grows — explicitly out of v1                                                                                                                                                                |

---

## Standing rules while building

1. **Update docs when a decision changes** (schema, endpoints, status flow).
2. No new feature without a line in this roadmap (or 01 PRD).
3. `npm run lint` + production `npm run build` must pass before calling a phase done.
4. Test purchase flow on mobile before every deploy.
5. Prefer boring, working solutions over clever ones.
