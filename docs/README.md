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
- [ ] Phase 2 — Storefront browse
- [ ] Phase 2 — Storefront browse
- [ ] Phase 3 — Cart, checkout, orders
- [ ] Phase 4 — Admin auth + catalogue CRUD
- [ ] Phase 5 — Admin orders, config, reports
- [ ] Phase 6 — SEO + performance pass
- [ ] Phase 7 — Production deployment
- [ ] Phase 8 — Post-launch
