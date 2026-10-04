# 08 — Deployment Guide (Railway + Vercel)

**Production topology**

| Piece                         | Host                                           | Domain             |
| ----------------------------- | ---------------------------------------------- | ------------------ |
| Next.js storefront + admin UI | **Vercel**                                     | `sispk.com` (apex) |
| Express API                   | **Railway**                                    | `api.sispk.com`    |
| Database                      | **MongoDB Atlas** (free M0 → paid when needed) | —                  |
| Images                        | **Cloudinary**                                 | CDN URLs           |
| Email (transactional)         | **Brevo** (free 300/day)                       | verified sender    |
| DNS                           | Domain registrar (Namecheap/Porkbun/etc.)      | A/CNAME records    |

> Domain example used throughout: **sispk.com** — replace with the real purchased domain.

---

## 1. Environment variables

### 1.1 `apps/api` (Railway)

| Key                        | Example / notes                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                 | `production`                                                                                                                                       |
| `PORT`                     | Railway injects `PORT` — app must `listen(process.env.PORT \|\| 4000)`                                                                             |
| `MONGODB_URI`              | `mongodb+srv://user:pass@cluster.mongodb.net/sis_prod`                                                                                             |
| `JWT_SECRET`               | long random string (`openssl rand -hex 32`) — **same secret as web? no: web never verifies JWT itself** (only API does). Web just forwards cookie. |
| `JWT_EXPIRES_IN`           | `7d`                                                                                                                                               |
| `WEB_ORIGIN`               | `https://sispk.com` (credentialed CORS allowlist)                                                                                                  |
| `CLOUDINARY_CLOUD_NAME`    | e.g. `sis-shoes`                                                                                                                                   |
| `CLOUDINARY_API_KEY`       |                                                                                                                                                    |
| `CLOUDINARY_API_SECRET`    |                                                                                                                                                    |
| `BREVO_API_KEY`            | Brevo v3 API key (Transactional → SMTP & API). Transport used when `SMTP_HOST` is empty; sender email must be verified (account email is auto-ok)  |
| `MAIL_FROM`                | `SIS Shoes <verified-sender@example.com>` — must match a Brevo-verified sender                                                                     |
| `NOTIFY_EMAIL`             | store inbox for contact-form alerts + new-order notifications                                                                                      |
| `SMTP_HOST/PORT/USER/PASS` | optional alternative transport (any SMTP relay) — takes precedence over Brevo                                                                      |
| `RATE_LIMIT_*`             | optional overrides                                                                                                                                 |

### 1.2 `apps/web` (Vercel)

| Key                     | Example / notes                                                                   |
| ----------------------- | --------------------------------------------------------------------------------- |
| `API_URL`               | `https://api.sispk.com/api/v1` — **server-side only** (Server Components + proxy) |
| `NEXT_PUBLIC_SITE_URL`  | `https://sispk.com` (canonical/OG/sitemap)                                        |
| `NEXT_PUBLIC_SITE_NAME` | `SIS — Shahid Insaf Shoes`                                                        |

Never expose Mongo URI / Cloudinary secret / JWT secret to `NEXT_PUBLIC_*`.

### 1.3 Local `.env.example` (root — documents all)

```bash
# apps/api (.env)
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/sis_dev
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
WEB_ORIGIN=http://localhost:3100
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BREVO_API_KEY=
MAIL_FROM="SIS Shoes <verified-sender@example.com>"
NOTIFY_EMAIL=

# apps/web (.env.local)
API_URL=http://localhost:4100/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3100
NEXT_PUBLIC_SITE_NAME=SIS — Shahid Insaf Shoes
```

---

## 2. MongoDB Atlas setup

1. Create Atlas account → M0 (free) cluster for start
2. Database Access: app user (password auth), least privilege `readWrite` on `sis_prod`
3. Network Access: IP `0.0.0.0/0` for v1 (Vercel/Railway use dynamic egress IPs) — **note:** acceptable for launch; revisit with Atlas Private Endpoint later
4. Create DB `sis_prod` (or let first insert create it)
5. Connection string → Railway `MONGODB_URI`
6. Seed prod: run seed once against prod URI (locally with prod env) or via admin UI manually
7. Backups: M0 = community snapshots; plan M10+ when revenue justifies

---

## 3. Railway (Express API)

> **Current live state (2026-10-04):** service `shahid-insaf-shoes` (project `18a25a0b…`), region `iad`, public domain `https://shahid-insaf-shoes-production.up.railway.app`, GitHub source `bilawal-malik/shahid-insaf-shoes@main` reconnected. Service settings (start `npm run start -w apps/api`, healthcheck `/health`) live **server-side**, applied via `railway config apply` from `.railway/railway.ts` (the root `railway.json` is deprecated — CLI 5.63 warns and did **not** honor it on `railway up`).
>
> **Gotchas hit (do not re-learn):**
>
> 1. `railway config apply --confirm-destructive` **deletes every variable not declared** in the authoring file — always re-set all 10 vars afterwards with `railway variable set KEY=… --skip-deploys` (sources: `apps/api/.env` + `temp.txt`; DB name swapped to `sis_prod`).
> 2. `railway config plan/apply` evaluates `.railway/railway.ts` via the npm `railway` SDK, which calls `execFileSync(process.env._ || 'railway', ['--version'])` — broken on Windows (no `railway.exe` on PATH). Fix: `$env:_ = 'C:\Users\Administrator\AppData\Roaming\npm\node_modules\@railway\cli\bin\railway.exe'` before running.
> 3. Atlas **Network Access must be `0.0.0.0/0`** (§2.3) — Railway egress IPs are dynamic; the API exits at boot with `[db] connection failed` otherwise (prod only).
> 4. Deploy: `railway up` from repo root, or push to `main`. Environment: `NODE_ENV`, `MONGODB_URI` (`…/sis_prod`), `JWT_SECRET`, `JWT_EXPIRES_IN`, `WEB_ORIGIN` (= web URL), `BREVO_API_KEY`, `MAIL_FROM`, `NOTIFY_EMAIL`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`.
> 5. Prod DB seeded: 24 products, 7 categories, 12 orders, 5 customers, 3 admins (`admin@sis.pk`, `bilawal@gmail.com`, `shahid@gmail.com` — all seeded passwords as in the seed file).

1. New project → **Deploy from GitHub** → root of repo
2. Configure:
   - **Root Directory:** `apps/api` (or monorepo-aware Nixpacks config)
   - **Build command:** `npm ci` (workspace-aware: run from repo root with `npm ci --workspace apps/api` if needed)
   - **Start command:** `npm start` → `node src/server.js` (or `node apps/api/src/server.js` if root-scoped)
3. **Monorepo gotcha:** Railway must install only the API workspace. Preferred setup:
   - Add `apps/api/package.json` with its own start script
   - Railway Root Directory = `apps/api` → treat as standalone Node project (simplest)
   - **Note:** Docker is intentionally not used — Vercel + Railway only (see `railway.json` at repo root for start command + healthcheck)
4. Add env vars (§1.1)
5. Generate domain → `api.sispk.com` (Railway Settings → Networking → Generate Domain, then CNAME to your DNS)
6. Health check path: `/health` (Railway checks `/api/health` if prefixed — align with deploy; docs assume mounted at `/health` root AND `/api/v1/...` versioned routes)
7. Logs: watch first boot — "Server listening", "Mongo connected"

**Railway deploy triggers:** every push to `main` (keep preview branches off for API if undesired).

---

## 4. Vercel (Next.js)

> **Current live state (2026-10-04):** project `binary-bombers1/shahid-insaf-shoes`, production alias **`https://shahid-insaf-shoes.vercel.app`**. Deployed with the CLI from `apps/web` (`vercel login` → `vercel link --project shahid-insaf-shoes` → `vercel env add … production` → `vercel --prod --yes`). Env: `API_URL` (= Railway URL + `/api/v1`, stored as secret), `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL` (= alias URL, type config). **Deployment Protection disabled** (`vercel project protection disable shahid-insaf-shoes --sso`) — re-enable only for previews. **Git connection NOT linked** (Vercel account `binary-bombers1` has no GitHub login connection) — pushes do **not** build on Vercel yet; deploy via CLI or connect GitHub in dashboard (`vercel git connect`).

1. Import Git repo → framework auto: **Next.js**
2. **Root Directory:** `apps/web` (Vercel monorepo support) → build command auto `next build`
3. Env vars (§1.2) — set for **Production + Preview + Development** as needed
4. Custom domain: add `sispk.com` (+ `www`) → Vercel gives nameservers or CNAME/A records:
   - Apex: `A 76.76.21.21` (or current Vercel apex IP) / CNAME `cname.vercel-dns.com` per Vercel instructions
   - www: `CNAME cname.vercel-dns.com`
   - Apex is canonical; Vercel redirect config: `www` → apex (or set canonical consistently)
5. HTTPS: automatic
6. `NEXT_PUBLIC_SITE_URL` must match final domain (sitemap/OG depend on it)

---

## 5. Cloudinary

1. Free account → create cloud → API keys
2. **Unsigned upload is NOT allowed** (admin upload goes through Express `/admin/upload` which signs server-side) ✓ secure by design
3. Folders: `sis/products`, `sis/categories`, `sis/banners`
4. Upload max size enforce: 5MB, jpg/png/webp
5. Keep transformation in delivery URL: `q_auto,f_auto,w_*` via next/image loader

---

## 6. DNS record summary (final)

| Type  | Name | Value                           | Purpose                     |
| ----- | ---- | ------------------------------- | --------------------------- |
| A     | @    | Vercel apex IP (per dashboard)  | storefront                  |
| CNAME | www  | cname.vercel-dns.com            | www → then redirect to apex |
| CNAME | api  | <railway-domain>.up.railway.app | API                         |

(Use nameservers mode at registrar if using Vercel DNS — either works; keep registrar DNS + records for simplicity.)

---

## 7. Post-deploy verification checklist

**Connectivity**

- [ ] `https://api.sispk.com/health` → `{ ok: true }`
- [ ] `https://sispk.com` loads; API called server-side (view source shows SSR product HTML)
- [ ] CORS: storefront proxied (browser never calls api cross-origin in normal flow)

**Functional (test on real phone)**

- [ ] Browse → PDP → size select → add to cart → checkout COD → order placed
- [ ] Order # format correct; appears in admin within seconds
- [ ] `track-order` works with order# + phone
- [ ] Admin login → update status Placed→Confirmed→Shipped→Delivered; timeline records; stock updates
- [ ] Cancel restores stock
- [ ] Register → verification email arrives (check spam); login blocked until verified; resend works
- [ ] Order placed → confirmation email arrives + NOTIFY_EMAIL admin alert arrives
- [ ] Change shipping flatRate in config → checkout total changes (new session)
- [ ] Image upload from admin works (Cloudinary prod)
- [ ] Guest cart persists across reloads; logged-in cart syncs

**SEO / polish**

- [ ] `https://sispk.com/sitemap.xml` valid; submitted to Search Console
- [ ] `robots.txt` correct
- [ ] Each key page: correct title/description/canonical (view-source)
- [ ] Rich Results Test on 1 PDP passes
- [ ] OG share preview looks right (WhatsApp/Twitter card debugger)
- [ ] 404 page works for random URL
- [ ] No `console` errors in prod build

**Ops**

- [ ] Vercel Analytics / Speed Insights on
- [ ] UptimeRobot pings `/health` (5 min) + homepage (15 min)
- [ ] Railway spend alerts set (budget guard)
- [ ] DB backup note in place
- [ ] Secrets rotated from dev values (JWT secret, Atlas password different from dev)

---

## 8. Rollback & troubleshooting

| Issue                             | Check                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| API 5xx after deploy              | Railway logs → usually missing env or Mongo URI typo; health endpoint first                             |
| CORS error in browser             | Proxy not used — ensure all fetches go through `/api/proxy` or SSR                                      |
| Cookie not set on login           | Proxy must forward `Set-Cookie` from API or set it itself with `secure`, `sameSite: 'lax'`, `path: '/'` |
| 404 on all pages after env change | `API_URL` wrong or API down → SSR pages fail; check Vercel function logs                                |
| Images broken                     | Cloudinary cloud name env missing or next.config remotePatterns missing domain                          |
| Stale price on PDP                | ISR revalidate; hard refresh; acceptable — checkout recomputes anyway                                   |

**Rollback:** Vercel + Railway both keep deployment history → instant rollback to previous deploy from dashboards.

---

## 9. Costs (order-of-magnitude, v1)

| Service       | Plan                                              | Est.         |
| ------------- | ------------------------------------------------- | ------------ |
| Vercel        | Hobby (personal) → Pro if commercial use required | $0 → $20/mo  |
| Railway       | Hobby $5 credit/mo; API usage ~small              | ~$0-5/mo     |
| MongoDB Atlas | M0 free → M10 when data/compliance needs          | $0 → ~$9+/mo |
| Cloudinary    | Free tier 25 credits/mo (plenty early)            | $0           |
| Domain        | .com yearly                                       | ~$10-15/yr   |

> **Note:** Vercel Hobby ToS restricts commercial usage — when revenue starts, budget Vercel Pro. Railway free tier is usage-credit based; expect small charge as traffic grows.

---

## 10. CI (optional, P7)

`.github/workflows/ci.yml` (nice-to-have):

- on PR: `npm ci` → `npm run lint` → `npm run build` (web)
- Deploy: Railway/Vercel Git integrations handle deploys (no custom CD needed)
