# 06 — SEO & Performance Plan

**Targets (mobile Lighthouse, production):**

- Performance ≥ 90
- SEO ≥ 95
- Accessibility ≥ 90
- Best Practices ≥ 95
- Core Web Vitals: **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1**

---

## 1. SEO

### 1.1 Technical foundations

| Item                    | Implementation                                                                                                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering               | SSR for all catalogue pages (Next.js Server Components); no client-only product pages                                                                                                                                                           |
| Titles                  | Unique pattern: PDP `"{Product Name} — Buy Online \| SIS Shoes"`; category `"{Category} — Shoes & Sandals \| SIS"`; ≤60 chars                                                                                                                   |
| Descriptions            | Unique per product (metaDescription) / category / page; fallback auto-generated from name + category + price; ≤155 chars                                                                                                                        |
| Canonical               | `canonical` URL on every page → `https://sispk.com/products/slug` (no trailing params)                                                                                                                                                          |
| robots.txt              | `Allow: /` · `Disallow: /admin`, `/api`, `/cart`, `/checkout`, `/account`, `/track-order` · `Sitemap: https://sispk.com/sitemap.xml`                                                                                                            |
| sitemap.xml             | Next `app/sitemap.js` — static routes + all active products + categories; `lastModified` from `updatedAt`; split if > 50k URLs (unlikely v1)                                                                                                    |
| 404 page                | Custom, `404` status, links to home/search/categories                                                                                                                                                                                           |
| Trailing slashes        | Consistent (config: `trailingSlash: false`, canonical matches)                                                                                                                                                                                  |
| hreflang                | Not needed (single locale)                                                                                                                                                                                                                      |
| HTTPS                   | Vercel auto + HSTS                                                                                                                                                                                                                              |
| Pagination              | Page-based links (`?page=2`) with `rel=next/prev` **not** required by Google but keep crawlable `<a>` links (no JS-only pagination)                                                                                                             |
| Faceted nav             | Filters use query params; only `category`, `sort` canonicalized — prevent index bloat: `noindex` on `/products?...` pages with deep filters OR rely on canonical to `/products` (choose: **canonical to clean `/products` for filtered views**) |
| Search page             | `noindex,follow` on `/search*`                                                                                                                                                                                                                  |
| Structured data         | see 1.3                                                                                                                                                                                                                                         |
| OG/Twitter              | Every page: `og:title`, `og:description`, `og:image` (default brand OG image + product images), `twitter:card=summary_large_image`                                                                                                              |
| Favicon                 | Standard set (icon, apple-touch, manifest optional)                                                                                                                                                                                             |
| Pagination crawlability | server-rendered `<a>` page links ✓                                                                                                                                                                                                              |

### 1.2 Page-type metadata map

| Route                  | Title source                                                   | Description source           | OG image              |
| ---------------------- | -------------------------------------------------------------- | ---------------------------- | --------------------- |
| `/`                    | "SIS — Shahid Insaf Shoes \| Peshawari Chappals & Footwear PK" | brand blurb                  | brand hero            |
| `/products/[slug]`     | `name — Buy Online \| SIS`                                     | metaDescription ?? auto      | primary product image |
| `/categories/[slug]`   | `{Name} — {count} Products \| SIS`                             | category meta ?? description | category image        |
| `/products`, `/search` | "Shop All Shoes & Sandals \| SIS"                              | static                       | brand                 |
| info pages             | `{Page} \| SIS`                                                | first paragraph              | brand                 |

### 1.3 Structured data (JSON-LD)

| Page                   | Schema                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| All (site-wide script) | `Organization` (name, logo, contactPoint, sameAs) + `WebSite` w/ SearchAction                                                  |
| PDP                    | `Product` (name, image[], description, sku, brand SIS, offers: price, priceCurrency PKR, availability InStock/OutOfStock, url) |
| PDP                    | `BreadcrumbList`                                                                                                               |
| Category               | `ItemList` (top products) + Breadcrumb                                                                                         |
| Home                   | `LocalBusiness` optional (address/phone from config)                                                                           |
| FAQ page               | `FAQPage`                                                                                                                      |

Validate with Google Rich Results Test + Schema.org validator pre-launch.

### 1.4 Content SEO (build-time tasks)

- [ ] Unique copy for: home hero, about, each category description (100-150 words min on top 5 categories)
- [ ] Product descriptions: 80+ words, real material/size info (not duplicated across products)
- [ ] FAQ answers targeting: "Peshawari chappal price in Pakistan", "SIS shoes delivery", "COD shoes Pakistan"
- [ ] Alt text on every image (product name + color + type pattern)
- [ ] Internal linking: PDP → category → related products; breadcrumbs everywhere
- [ ] Google Business Profile + Search Console + Analytics (GA4 or Vercel Analytics) at launch
- [ ] Clean domain: `sispk.com` (or chosen) → WWW redirect decision: **apex canonical, www 301 → apex** (or vice versa — pick one at launch, keep consistent)

### 1.5 Post-launch SEO

- Search Console: submit sitemap, fix crawl errors weekly first month
- Monitor Core Web Vitals report
- Add blog/resources section later (phase 8+) for "how to care for leather" style content

---

## 2. Performance plan

### 2.1 Images (biggest lever)

- `next/image` everywhere with Cloudinary loader + `sizes` attr
- Formats: WebP/AVIF via Cloudinary `f_auto,q_auto`
- Sizes: card ~400w, PDP main ~800w, hero ~1600w
- `priority` on LCP image (PDP main image / home hero) only
- Fixed `width/height` or `aspect-ratio` → **no CLS**
- No images in hero that delay text (text in HTML)

### 2.2 Next.js rendering strategy

| Page                       | Strategy                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Home                       | ISR (`revalidate: 60`) or dynamic w/ cache tags — product rows fetched server-side                                                   |
| Category / all products    | SSR or ISR 60s; static shell + streamed data                                                                                         |
| PDP                        | ISR `revalidate: 30-60` (price/stock changes handled by client revalidate on add-to-cart + admin purge note); `dynamicParams = true` |
| Info pages                 | Fully static (`force-static`)                                                                                                        |
| Checkout / account / admin | Dynamic, no caching                                                                                                                  |
| `/config` fetch            | Server-side with `next: { revalidate: 60 }`                                                                                          |

- Avoid `fetch` waterfalls: parallel `Promise.all` for independent data; single BFF call where multiple endpoints needed
- Stream slow sections with `<Suspense>` boundaries (e.g. related products)

### 2.3 JS & rendering weight

- Storefront: minimize client JS — PDP size selector, cart, filters are the main islands
- Zustand cart: `persist` middleware (localStorage), hydration-safe (suppress hydration warnings / gate on mounted)
- Admin: fully client, code-split by route (Next default), charts lazy-loaded
- No heavy UI libs (no MUI/antd); Tailwind only
- Fonts: `next/font` (self-hosted), `display: swap`, preload critical (body font)
- Defer non-critical third parties (none expected v1 beyond analytics)

### 2.4 API performance

- Compound indexes per 03 §
- List endpoints: default `limit=20`, cap 48; project only needed fields (`select`)
- Dashboard aggregations: `$facet` single query
- In-memory config cache (TTL 60s or invalidate on PUT)
- Response compression (`compression` middleware)
- Rate limiting prevents abuse spikes

### 2.5 Network / Vercel

- HTTP/2, brotli (Vercel default)
- `next.config` headers: long cache for `/_next/static` + Cloudinary immutable
- ISR reduces origin hits; Vercel edge cache
- Minimal redirects; canonical host enforced

### 2.6 Measurement (definition of done for perf)

```bash
# lab
npm run build && npm run start   # Lighthouse CLI or Vercel Speed Insights
lighthouse https://<preview-url> --mobile --quiet
```

- Lighthouse CI (optional GitHub Action) on preview deploys: perf ≥ 90, SEO ≥ 95
- Real user: Vercel Speed Insights enabled; watch LCP/INP 2 weeks post-launch
- Budget: initial route JS < 150KB gzipped (storefront), PDP LCP image < 120KB

### 2.7 Checklist before "perf done"

- [ ] No layout shift (images/ads/badges reserved space)
- [ ] No unused admin code in storefront bundles (separate routes)
- [ ] Font subset (latin) only
- [ ] Third-party scripts: GA4 with `afterInteractive` or partytown if slow
- [ ] 404s and error pages cached correctly (short TTL)
- [ ] Mobile 4G test on real phone for top 5 pages

---

## 3. Accessibility (part of quality bar)

- Semantic landmarks: `header/nav/main/footer`
- All interactive: keyboard reachable, visible focus ring
- Forms: `<label for>`, error `aria-describedby`, `aria-invalid`
- Modals/drawers: focus trap, Esc close, `aria-modal`
- Color contrast ≥ 4.5:1 (text) — check badge colors
- Size/color selection as `role=radiogroup` or buttons with `aria-pressed`
- Test with: keyboard-only pass + Lighthouse a11y + screen reader spot-check (NVDA/VoiceOver) on PDP + checkout
