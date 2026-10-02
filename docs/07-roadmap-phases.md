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

## P4 — Admin: auth + catalogue

**Goal:** admin runs the catalogue without the DB.

Tasks:

- [ ] Admin route guard (role check via `/auth/admin-check`) + login redirect flow
- [ ] Admin shell: sidebar, topbar, responsive drawer
- [ ] Dashboard **data endpoint** (`/admin/dashboard`) + page skeleton (fill in P5)
- [ ] Products list (search/filter/pagination/status) + quick status toggles
- [ ] Product create/edit form: variants matrix (+bulk generator), images upload via Cloudinary (`/admin/upload`), flags, SEO fields, slug handling
- [ ] Archive/restore
- [ ] Categories tree CRUD with validation (no cycles, delete guards)
- [ ] Settings: admin profile + password

**Done when:** admin can create a product with 10 variants + 3 images and it appears on storefront (active) within refresh.

---

## P5 — Admin: orders, config, sales

**Goal:** full operations control.

Tasks:

- [ ] Orders list (filters + URL state) + detail page
- [ ] Status transition endpoint + timeline + confirm dialogs + stock restore rules + packing slip print CSS
- [ ] Internal notes
- [ ] Dashboard complete: KPIs, 14-day chart (recharts), recent orders, low-stock, status breakdown
- [ ] Customers list/detail (+deactivate)
- [ ] Config editor (shipping flatRate/freeAbove/estimatedDays, store info, announcement, lowStock threshold) + cache invalidation — **verify storefront reflects new shipping fee**
- [ ] Reports: date-range summary + by-day chart + top products + CSV export

**Done when:** full lifecycle Placed→Delivered exercised in UI; shipping fee changed in config alters checkout total; cancel restores stock; report numbers match order list.

---

## P6 — SEO & performance pass

**Goal:** hit the numbers in doc 06.

Tasks:

- [ ] Metadata audit per route map · canonical · robots · sitemap complete · OG images
- [ ] JSON-LD complete (Product, Breadcrumb, Organization, FAQ)
- [ ] Content pass: category/product descriptions, alt text, About/FAQ copy
- [ ] Image optimization audit (sizes, priority, aspect ratios)
- [ ] Suspense/parallel fetch, ISR tuning, no waterfall
- [ ] Accessibility pass (keyboard, contrast, forms)
- [ ] Lighthouse mobile on home/PDP/category/checkout — fix until targets met
- [ ] 404/403 pages, error handling UX polish

**Done when:** Lighthouse ≥ targets (perf 90, SEO 95, a11y 90); Rich Results Test passes on PDP.

---

## P7 — Production deployment

**Goal:** live store on real domain.

Tasks:

- [ ] MongoDB Atlas production cluster + DB user + IP allowlist (0.0.0.0/0 for Vercel/Railway egress — document tradeoff; use Atlas App alternatives later if needed)
- [ ] Railway: deploy `apps/api` (root Dockerfile or Nixpacks), health check `/health`, env vars, generate `api.<domain>` subdomain
- [ ] Vercel: deploy `apps/web`, env vars (`API_URL`), custom domain, apex/www decision
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

| Priority | Item                                                     | Notes                                                                                                                                                     |
| -------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Transactional email (order confirmation, status updates) | Resend/SMTP; single `notificationService`                                                                                                                 |
| 2        | **Online payment integration**                           | Design already ready: `payment.method/status`; gateway via Express (JazzCash/Easypaisa/Stripe- PK) — checkout step + webhook route + admin reconciliation |
| 3        | Product reviews (simple, moderated)                      | `reviews` collection                                                                                                                                      |
| 4        | Coupon codes                                             | `coupons` collection + `pricing.discount` wiring                                                                                                          |
| 5        | Wishlist                                                 |                                                                                                                                                           |
| 6        | Abandoned cart emails                                    | needs 2+                                                                                                                                                  |
| 7        | WhatsApp order share button                              | quick win                                                                                                                                                 |
| 8        | Blog / size guide content                                | SEO growth                                                                                                                                                |
| 9        | Contact inbox in admin                                   | `ContactMessage` already collected                                                                                                                        |
| 10       | Multi-admin + roles (RBAC)                               | only if team grows — explicitly out of v1                                                                                                                 |

---

## Standing rules while building

1. **Update docs when a decision changes** (schema, endpoints, status flow).
2. No new feature without a line in this roadmap (or 01 PRD).
3. `npm run lint` + production `npm run build` must pass before calling a phase done.
4. Test purchase flow on mobile before every deploy.
5. Prefer boring, working solutions over clever ones.
