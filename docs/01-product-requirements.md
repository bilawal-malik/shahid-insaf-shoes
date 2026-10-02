# 01 — Product Requirements (PRD)

**Project:** SIS — Shahid Insaf Shoes
**Type:** Real production e-commerce (not a portfolio piece)
**Market:** Pakistan · Products: sandals, shoes, Peshawari chappal-style local footwear
**Payment:** Cash on Delivery only (architecture supports future online payments)

---

## 1. Goals

| #   | Goal                                         | Success signal                                       |
| --- | -------------------------------------------- | ---------------------------------------------------- |
| G1  | Sell SIS products online with COD            | Completed orders flowing through full lifecycle      |
| G2  | Rank in Google for local searches            | Product/category pages indexed, good Core Web Vitals |
| G3  | Load fast on mobile (majority of PK traffic) | LCP < 2.5s on 4G                                     |
| G4  | Run the whole store from one admin panel     | Products, orders, config managed without touching DB |
| G5  | Be extendable for online payments later      | Adding a gateway = new module, no schema rewrite     |

## 2. Non-goals (explicitly out of scope)

- RBAC / multi-admin permission matrices (single `admin` role)
- Multi-vendor / marketplace
- Internationalisation, multi-currency (PKR only)
- Native mobile apps (responsive web only)
- Real-time chat support, wishlists, reviews moderation queues (basic reviews may be added post-launch)
- Coupon engine v1 (design leaves room; not built in v1)

## 3. User roles

### 3.1 Guest

- Browse, search, add to cart, checkout with COD using name + phone + address
- Look up an order by order ID + phone

### 3.2 Customer (registered, optional)

- All guest abilities, plus:
- Saved addresses, order history, profile
- Registration: name, email, phone, password

### 3.3 Admin

- Full control of catalogue, orders, config, reports
- Auth: email + password → JWT (httpOnly cookie)
- No granular permissions — one admin role

## 4. Feature set

### 4.1 Storefront (customer-facing)

**Discovery**

- Home page: hero banner, category tiles, featured products, new arrivals, trust badges (COD, delivery across Pakistan)
- Category listing: product grid + filters (size, color, price range, availability) + sort (newest, price asc/desc, popularity)
- Product detail: image gallery, size selector (required), color selector, price + optional compare-at price, description, materials/care, stock indicator, related products, breadcrumb
- Search: keyword search across product name/tags/category
- Static/info pages: About, Contact, FAQ, Shipping & Delivery, Returns & Exchange, Privacy Policy, Terms

**Commerce**

- Cart: add / update qty / remove, persists in localStorage for guests, synced to DB for logged-in users
- Stock validation: cannot add more than available variant stock
- Checkout (COD): contact info, shipping address (name, phone, email optional, address line, city, province, postal optional), shipping cost from config, order summary → place order
- Guest checkout default; option to register at checkout
- Order confirmation screen + order number
- Order lookup: order ID + phone → status timeline

**Account (lightweight)**

- Register / login / logout
- Profile: name, phone, email, change password
- Address book: save up to N addresses, pick one at checkout
- Order history with status

### 4.2 Admin panel

**Dashboard**

- KPIs: revenue & orders today / last 7 days / last 30 days, average order value
- Sales chart (revenue by day, last 14 days)
- Recent orders (last 10)
- Low-stock alerts (variants below threshold)
- Order status breakdown (counts by status)

**Products**

- List with search, filter by category/status, pagination
- Create / edit: name, slug (auto), description (rich-ish text), category, brand optional, tags
- Variants: size × color matrix, each with SKU, price override optional, stock qty
- Media: multiple images (Cloudinary), primary image selection, alt text
- Status: `active` | `draft` | `archived`
- Featured / new-arrival flags
- Soft delete (archive) — never hard delete a product with orders

**Categories**

- Tree (parent/child) — e.g. Sandals → Peshawari Chappal
- Create / edit: name, slug, description, image, sort order, SEO title/description
- List: shows product count per category

**Orders**

- List: filter by status, date range, search by order # / phone / name
- Detail: customer info, line items, payment (COD), shipping cost, totals, status timeline with actor + timestamp + note
- Status transitions (enforced flow):

```
placed → confirmed → shipped → delivered
   ↓         ↓          ↓
cancelled  cancelled   (terminal after delivered; returns handled separately)
                ↓
             returned (from shipped/delivered, admin decision)
```

- Admin can add internal note on each transition
- Order cancellation restores stock
- Print-friendly packing slip view (browser print CSS)

**Customers**

- List with search; detail = profile + their orders

**Configuration (settings from DB, editable in admin)**

- `shipping.flatRate` — flat shipping fee (PKR)
- `shipping.freeAbove` — order subtotal threshold for free shipping (0 = disabled)
- `shipping.codEnabled` (bool, future-proof)
- `store.name, phone, email, address, socialLinks, announcementBar text`
- `inventory.lowStockThreshold` — default 5
- `checkout.allowGuest` (bool)

**Reports (sales)**

- Date-range revenue, order count, AOV
- Top-selling products (qty + revenue)
- Orders by status over range
- Export CSV (client-side generation is fine v1)

**Settings**

- Admin profile (name, email), change password

### 4.3 Notifications (scope-limited)

- v1: order placed → confirmation **screen** only; email integration deferred to Phase 8
- Structure ready for SMTP/Resend integration (a single `notification service` module)

### 4.4 Payment readiness (no online payments in v1)

- Order document has `payment.method` (`cod` default) and `payment.status` (`pending` → `paid`/`failed`/`refunded`)
- Checkout flow has a `paymentStep` abstraction so a gateway becomes a new method later
- No card data ever touches our servers in the future design (gateway-hosted / redirect)

## 5. Order lifecycle (source of truth)

| Status      | Meaning                   | Who sets | Allowed next              |
| ----------- | ------------------------- | -------- | ------------------------- |
| `placed`    | Customer submitted order  | system   | confirmed, cancelled      |
| `confirmed` | Admin verified / accepted | admin    | shipped, cancelled        |
| `shipped`   | Handed to courier         | admin    | delivered, returned       |
| `delivered` | Completed                 | admin    | returned (return request) |
| `cancelled` | Before shipping           | admin    | —                         |
| `returned`  | Returned by customer      | admin    | —                         |

- Stock decremented at `placed`, restored on `cancelled`/`returned`
- Every transition appends to `statusHistory[]`: `{ status, note, by, at }`
- Customer-facing statuses shown: Placed / Confirmed / Shipped / Delivered (cancelled & returned shown when applicable)

## 6. Business rules

1. Prices in **PKR**, integer amounts (no float money) — store as numbers in paisa OR rupees with 2 decimals; decision: **store PKR as number with 2 decimals**, display with `Rs` prefix.
2. Variant stock is a non-negative integer; product is "available" if any variant stock > 0 and status = active.
3. Slug uniqueness enforced per collection.
4. Discount: optional `price` (current) + `compareAtPrice` (struck-through); if `compareAtPrice > price` show badge `X% OFF`.
5. Shipping cost = config flat rate; if subtotal ≥ `freeAbove` (>0) → 0.
6. Order total = sum(lineItems) + shippingCost (taxes: PK — note to self, storefront shows "incl. of all taxes" only if accurate; v1 = no tax field, can add `taxRate` to config later).
7. Deleting a category with products is blocked (reassign first).

## 7. Content & SEO requirements (summary → full plan in 06)

- Unique title + meta description per product/category/page
- Clean URLs: `/products/[slug]`, `/categories/[slug]`
- JSON-LD: Product, BreadcrumbList, Organization, LocalBusiness
- sitemap.xml + robots.txt auto-generated
- Image alt text required on upload

## 8. Quality bar

- Mobile-first responsive, breakpoints: 640 / 768 / 1024 / 1280
- Works on slow 3G (static shell, optimized images)
- Accessible basics: keyboard nav, focus states, semantic HTML, alt text, label-input association
- Consistent empty / loading / error states on every page
- No console errors/warnings in production build

## 9. Acceptance criteria for "launch-ready"

- [ ] Full purchase flow works on mobile: browse → cart → COD checkout → order visible in admin
- [ ] Admin can manage products, categories, orders end-to-end
- [ ] Order status flow enforced; stock correct after cancel/return
- [ ] Shipping fee comes from config table
- [ ] Lighthouse: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90 (mobile)
- [ ] All info pages live; contact form reaches store email (or documented deferral)
- [ ] Production on custom domain via Vercel + Railway, HTTPS on
