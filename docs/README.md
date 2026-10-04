# SIS — Shahid Insaf Shoes

Production-level e-commerce platform for **SIS (Shahid Insaf Shoes)** — a local Pakistani sandal & shoe brand.

**Stack:** Next.js (JavaScript) + Express.js + MongoDB · **Infra:** Vercel (frontend) + Railway (API)

---

## Documentation index

| #   | Document                                               | Purpose                                           |
| --- | ------------------------------------------------------ | ------------------------------------------------- |
| 01  | [Product requirements](./01-product-requirements.md)   | Features, user roles, user flows                  |
| 02  | [Architecture](./02-architecture.md)                   | Stack decisions, system diagram, folder structure |
| 03  | [Database schema](./03-database-schema.md)             | Collections, fields, indexes, relations           |
| 04  | [API specification](./04-api-specification.md)         | Every endpoint, request/response shapes           |
| 05  | [UI pages](./05-ui-pages.md)                           | Sitemap + page inventory for storefront & admin   |
| 06  | [SEO & performance plan](./06-seo-performance-plan.md) | Rankings, Core Web Vitals, structured data        |
| 07  | [Roadmap & phases](./07-roadmap-phases.md)             | Build order, milestones, definition of done       |
| 08  | [Deployment guide](./08-deployment-guide.md)           | Railway + Vercel + domain + env vars              |

---

## Golden rules for this project

1. **Documentation before code.** This folder is the source of truth. Update docs when decisions change.
2. **Working & professional over fancy.** Light, clean, engaging UI — no cinematic/animation-heavy design.
3. **Core but complete.** No RBAC or advanced enterprise features. Two roles: `customer` and `admin`.
4. **Payment-ready, COD-first.** Cash on Delivery now; the schema and checkout are designed so an online gateway slots in later without rework.
5. **SEO and speed are requirements, not nice-to-haves.**
6. **Real production project** — domain + hosting budget exists (Railway + Vercel).

## Current status

- [x] Documentation drafted (9 docs)
- [x] Phase 0 — Repo setup (monorepo, lint, scaffolds, build passing)
- [x] Phase 1 — Database + API foundation (models, auth, catalogue API, seed, smoke 26/26)
- [x] Phase 2 — Storefront browse (home, catalog, category, PDP, search, info pages, JSON-LD)
- [x] Phase 3 — Cart, checkout, orders (guest + account COD flow, track-order, account pages, smoke 46/46)
- [x] Phase 4 — Admin auth + catalogue (guard/shell, dashboard, products CRUD + upload, categories, settings, smoke 69/69)
- [x] Phase 5 — Admin orders, config, reports (orders lifecycle + notes, customers, store config, reports + CSV, smoke 123/123)
- [x] Phase 6 (code) — SEO + error UX pass (FAQ/Breadcrumb JSON-LD, default OG image + icon, noindex on utility routes, robots, `error.jsx`)
- [x] Transactional email (Brevo/SMTP transport, reset codes, order confirmation + status updates, contact + new-order alerts, dev outbox, smoke-covered)
- [x] Email verification on register (6-digit OTP, block-until-verified, resend; OTP delivered by email only — never shown on screen; verify auto-signs-in and redirects home; real Brevo delivery verified; covered by smoke + e2e)
- [x] Browser E2E (`npm run e2e`, 25 checks) — guest checkout → confirmation → track-order (status + items), register → verify email → auto sign-in → home, forgot → reset → sign-in, contact, admin status transition. Found + fixed: checkout redirect race (order landed on empty cart) and track-order crash (rendered address the lookup API deliberately omits)
- [ ] Phase 6 (manual) — Lighthouse runs, content/copy pass, accessibility review, Rich Results Test
- [x] Phase 7 — Production deployment (LIVE: Vercel web `shahid-insaf-shoes.vercel.app` + Railway API `shahid-insaf-shoes-production.up.railway.app`, Atlas `sis_prod` seeded, Cloudinary + Brevo wired; custom DNS pending if a domain is bought)
- [ ] Phase 8 — Post-launch
