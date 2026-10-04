# SIS — Shahid Insaf Shoes

Production e-commerce platform for **SIS (Shahid Insaf Shoes)** — a local Pakistani sandal & shoe brand. Cash on delivery, full admin panel, SEO-first storefront.

**Stack:** Next.js 16 (JavaScript) · Express.js · MongoDB · Tailwind CSS

**Infrastructure:** [Vercel](https://vercel.com) (web) · [Railway](https://railway.app) (API) · MongoDB Atlas · Cloudinary

## Getting started

```bash
npm install
cp .env.example .env      # then fill apps/api/.env + apps/web/.env.local
npm run dev               # web :3100 · api :4100
```

## Documentation

All project documentation lives in [`docs/`](./docs/README.md):

| Doc                                                       |                                  |
| --------------------------------------------------------- | -------------------------------- |
| [Product requirements](./docs/01-product-requirements.md) | Features, roles, order lifecycle |
| [Architecture](./docs/02-architecture.md)                 | Stack, structure, key flows      |
| [Database schema](./docs/03-database-schema.md)           | Collections & fields             |
| [API specification](./docs/04-api-specification.md)       | Every endpoint                   |
| [UI pages](./docs/05-ui-pages.md)                         | Sitemap + page inventory         |
| [SEO & performance](./docs/06-seo-performance-plan.md)    | Rankings & Core Web Vitals       |
| [Roadmap](./docs/07-roadmap-phases.md)                    | Phases P0–P8                     |
| [Deployment](./docs/08-deployment-guide.md)               | Railway + Vercel + DNS           |

## Commands

| Command                     |                                             |
| --------------------------- | ------------------------------------------- |
| `npm run dev`               | Start web + API together                    |
| `npm run build`             | Production build                            |
| `npm run lint`              | ESLint (0 warnings allowed)                 |
| `npm run format`            | Prettier                                    |
| `npm run seed`              | Seed dev data (needs MongoDB)               |
| `npm run smoke -w apps/api` | API smoke tests (live `:4100` API required) |
