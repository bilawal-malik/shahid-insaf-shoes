# AGENTS.md

npm workspaces monorepo (`apps/*`): `apps/web` = Next.js 16 **JavaScript** App Router (no TypeScript — don't add `.ts`), `apps/api` = Express 4 ESM (`"type": "module"`).

## Commands (root)

- `npm install` — installs both workspaces
- `npm run dev` — both apps via concurrently: web `:3100`, api `:4100/api/v1`
- `npm run lint` — `eslint . --max-warnings 0`; **any warning fails**. `lint:fix` available
- `npm run format` / `format:check` — Prettier; also formats `docs/*.md`. Run `format` before finishing (check currently fails on many files)
- `npm run build` — builds **only** `apps/web`
- `npm run seed` — API seed against MongoDB; skips if an admin exists, wipe+reseed: `npm run seed -w apps/api -- --force`
- `npm run smoke -w apps/api` — the only API test suite; needs a **live, seeded** API on `:4100` (start `npm run dev` first; expects ≥12 products, ≥3 root categories). Override target with `SMOKE_BASE`. Current suite: 128 checks, incl. full admin order lifecycle + mail outbox assertions + register → verify-email → login flow; cleans up its own test data from the DB after each run
- `npm run e2e` — browser journeys (`scripts/e2e.mjs`, Playwright using **system Chrome** via `channel: 'chrome'` — no browser download). Needs `npm run dev` running. 25 checks: guest checkout → confirmation → track-order (items listed), register → email verification → auto sign-in → home, forgot → reset → sign-in, contact form, admin status transition
- No unit tests, no typecheck. CI (`.github/workflows/ci.yml`) runs lint + format:check + build; **smoke + e2e are local-only** (live DB + browser) — run lint → format → build → smoke → e2e before calling work done

## Env / ports

- Non-default ports: web **3100**, api **4100** (3000/4000 treated as taken). `apps/api/src/config/env.js` falls back to `4000`, but web hardcodes `http://localhost:4100/api/v1` — keep `PORT=4100`
- Env files are **per-app**: `apps/api/.env` and `apps/web/.env.local` (template: `.env.example`). A root `.env` is never read
- API exits at boot if `MONGODB_URI`/`JWT_SECRET` missing; in dev it still boots when Mongo is unreachable (subsequent requests 500)
- `.env*`, `temp.txt`, `atlas.env` are gitignored **and hold real credentials** — never commit, print, or paste them
- Uploads go to Cloudinary when configured, else to local disk `apps/api/uploads` (served at `/uploads`; not synced to hosting)
- Deploy: **no Docker** — Railway hosts the **API only** (service settings live server-side: start `npm run start -w apps/api`, healthcheck `/health`; `railway.json` at root is deprecated/ignored by CLI 5.63 — real config is `.railway/railway.ts`, gitignored, applied via `railway config apply`; **gotcha:** apply deletes undeclared variables → re-set them with `railway variable set … --skip-deploys` after every apply). Deploy commands: `railway up` (CLI) or push to `main` (GitHub source reconnected). Vercel hosts the **web** — `vercel --prod` from `apps/web` (project `binary-bombers1/shahid-insaf-shoes`; Git connection NOT linked — pushes don't build on Vercel yet; deployment protection disabled via `vercel project protection disable --sso`). Live: web `https://shahid-insaf-shoes.vercel.app`, API `https://shahid-insaf-shoes-production.up.railway.app` (`WEB_ORIGIN` set to the web URL). API listens on `process.env.PORT || 4000`

## Request flow (don't break)

- Server Components fetch Express directly via `API_URL`; the browser only ever hits `/api/proxy/*` (`apps/web/src/lib/proxy.js`), which forwards the httpOnly `sis_jwt` cookie as `Authorization: Bearer`. No client-side cross-origin API calls
- New cookie-carrying endpoint prefixes must be added to `PRIVATE_PREFIXES` in `apps/web/src/lib/proxy.js` or they'll be cached
- Express mounts everything under `/api/v1` (`apps/api/src/routes/index.js`); layering is `route → controller → service → model` — services own totals, status transitions, stock
- Rate limits are tight and per-IP: login 10/min, register 5/min, order 10/min, contact 5/min — repeated smoke runs inside one minute can 429
- Admin guard is server-side in `apps/web/src/app/admin/layout.jsx` (cookie + `/auth/admin-check`); API `/admin/*` still requires `role=admin`

## Conventions

- `docs/` is the source of truth — update docs when decisions change; phase status checklist lives in `docs/README.md`
- Transactional email: `apps/api/src/services/mailService.js` — `sendMail` **never throws** (callers fire-and-forget); transport order `SMTP_*` (nodemailer) → `BREVO_API_KEY` (Brevo REST) → skip+record in non-prod outbox (`GET /admin/mail/outbox`, admin-only, 404 in prod). Templates in `mailTemplates.js`; `NOTIFY_EMAIL` receives contact + new-order alerts
- Lint quirks: `no-console` warns in `apps/web` (only `console.warn`/`error` allowed), is off in `apps/api`; `prefer-const` and `eqeqeq: smart` are errors
- Prettier: single quotes, semicolons, `printWidth: 100`, trailing comma `es5`, LF
