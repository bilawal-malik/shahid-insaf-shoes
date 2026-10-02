# 05 — UI Pages & Sitemap

**Theme direction:** light background (`#FFFFFF` / soft grays), brand accent (deep brown or green — finalize in Phase 2 with product photography), generous whitespace, clear typography, subtle hover states, **no heavy animation/cinematic effects**. Mobile-first.

**Component vocabulary (shared):** Button (primary/outline/ghost/danger), Input, Select, Textarea, Modal, Drawer, Badge, Card, Table, Tabs, Toast, Skeleton, EmptyState, Pagination, Breadcrumb.

---

## 1. Sitemap (storefront)

```
/                                   Home
/products                           All products (grid + filters)
/products/[slug]                    Product detail
/categories                         (optional index — can redirect to /products)
/categories/[slug]                  Category listing
/search?q=                          Search results
/cart                               Cart
/checkout                           Checkout (COD)
/order-confirmation/[orderNumber]    Success page
/track-order                        Order lookup form → status timeline
/login  /register                   Auth
/account                            Profile (guarded)
/account/orders                     Order history (guarded)
/account/orders/[id]                Order detail (guarded)
/account/addresses                  Address book (guarded)
/about /contact /faq
/shipping-and-delivery /returns-and-exchange
/privacy /terms
/sitemap.xml  /robots.txt  /404  /403
```

---

## 2. Storefront pages

### 2.1 Header (global)

- Top announcement bar (from config, if enabled): e.g. "Free delivery over Rs 5,000 · COD all Pakistan"
- Logo left · nav center: Home, Sandals, Shoes, Slippers, About, Contact (top categories from DB, max 5) · search icon · account icon · cart icon w/ badge count
- Mobile: hamburger → slide-in menu; sticky on scroll with shadow
- Search: expandable input → `/search?q=`

### 2.2 Footer (global)

- 4 columns: Brand blurb + social · Shop links (categories) · Help (FAQ, Shipping, Returns, Contact) · Contact info (phone, WhatsApp, address, COD badge)
- Bottom bar: © SIS, Privacy, Terms
- Real contact data from `/config`

### 2.3 Home `/`

1. **Hero:** wide image, headline (e.g. "Handcrafted Peshawari Chappals"), subtext, CTA "Shop Now" → /products — static, text legible (no video)
2. **Trust strip:** COD · Delivery 3-5 days · Quality leather · Easy returns (icons)
3. **Category tiles:** 3-6 categories with image + name → category page
4. **Featured products** row: 4-8 ProductCards, "View all"
5. **New arrivals** row
6. **Banner:** mid-page promo (static image/text)
7. **Best sellers / popular** row (sort by soldCount)
8. SEO: Organization + WebSite JSON-LD

### 2.4 ProductCard (reusable)

Image (1:1, next/image) · name (2-line clamp) · price + optional struck `compareAtPrice` + `X% OFF` badge · color dots or "3 colors" · "New"/"Featured" badges · hover: slight shadow + image zoom (subtle) · whole card links to PDP · skeleton while loading

### 2.5 All products `/products`

- Left sidebar (desktop) / bottom-sheet (mobile): **Filters** — Category (tree checkboxes), Size (chips), Color (swatches), Price (min/max inputs or ranges), Availability toggle · **Clear all**
- Top bar: results count · Sort select (Newest, Price low→high, high→low, Popular) · mobile "Filter" button
- Grid: 2 col mobile / 3-4 desktop · pagination (page-based, not infinite scroll — better for SEO + simplicity)
- Empty state: friendly message + clear-filters CTA
- Filter state in **URL query params** (shareable, back-button friendly)

### 2.6 Category `/categories/[slug]`

- Same as 2.5 pre-filtered, plus category header: name, description, cover image (if set), breadcrumb
- Children categories shown as chips at top (if any)
- generateMetadata from category meta/defaults

### 2.7 Product detail `/products/[slug]` — **most important page**

- Breadcrumb (Home / Category / Name) with BreadcrumbList JSON-LD
- **Gallery (left/top):** main image + thumbnails; mobile = swipe carousel with dots
- **Info column:** title · rating placeholder (skip reviews v1) · price + compareAt + discount badge · short stock line ("In stock" / "Only 3 left" / "Out of stock")
- **Size selector (required):** chips 40-45 — **no size chart modal in v1** (link text "Size guide" → static page optional)
- **Color selector:** swatch chips (filters available variants)
- **Qty stepper** (clamped to variant stock)
- **Add to Cart** (primary, full width mobile) · disabled until size chosen (helper text "Select a size")
- Trust mini-row: COD · 3-5 day delivery · 7-day exchange (copy from config)
- Accordion: Description · Materials & Care · Shipping & Exchange
- **Related products:** 4 same-category cards
- JSON-LD: Product (+Offer) + BreadcrumbList
- Out of stock: disable CTA, show "Notify later" hidden (no real notify in v1 — or just message)

### 2.8 Search `/search`

- Query in URL; results grid reuse of 2.5 card grid; "No results for X" suggestions (try different keywords / browse categories)

### 2.9 Cart `/cart`

- Line items: image, name, size/color, unit price, qty stepper, remove, line total
- Summary card: subtotal, shipping ("Rs 250" or "FREE — orders over Rs 5,000" from config), **total**
- "Proceed to checkout" · Continue shopping link
- Empty state → CTA to /products
- Guest cart from localStorage; merge on login
- Stock conflict warnings (e.g. "Only 2 left") with auto-clamp

### 2.10 Checkout `/checkout` (guest-friendly)

Single page, 2-3 visual steps (accordion or left-form + right-summary; **right summary always visible desktop**):

1. **Contact** — name, phone (required, PK format `03XXXXXXXXX`), email optional
2. **Shipping address** — or pick saved address if logged in · toggle "Create an account with this order" → password field (optional)
3. **Delivery** — shows flat rate / free-shipping logic, estimated days (from config) · **Payment: "Cash on Delivery"** radio (only option; UI structured so more radios can appear later)
4. **Review summary** + "Place order — Rs X" button (loading state on submit)

- Inline field validation + server errors mapped to fields
- 409 stock error → banner with details
- Not logged in? gentle link "Sign in to use saved addresses"
- Guard: empty cart → redirect /cart

### 2.11 Order confirmation `/order-confirmation/[orderNumber]`

- Big check icon · "Thank you!" · order number + copy button · summary (items, total, COD note: "Pay Rs X on delivery") · delivery estimate · "Track order" + "Continue shopping"
- Not-found → /404-ish friendly

### 2.12 Track order `/track-order`

- Form: order number + phone → shows status stepper (Placed → Confirmed → Shipped → Delivered) + timestamps + last update · items summary (no full address)
- Error: "No order found with those details"

### 2.13 Auth

- **Login:** email + password → redirect `next` param or role-based (admin → /admin)
- **Register:** name, email, phone, password, confirm
- Centered card layout, logo on top, link to alternate mode

### 2.14 Account (guarded, simple layout with side nav)

- **Profile:** view/edit name, phone, email; change password form
- **Orders:** table/cards: number, date, status badge, total, view
- **Order detail:** same as track-order but full (own address) + reorder button (fills cart)
- **Addresses:** list, set default, add/edit modal, delete (block if last? no — allow zero)

### 2.15 Info pages (static content, admin-editable later if needed)

- **About:** brand story, craftsmanship, photos, values — light professional layout
- **Contact:** store info from config + form (POST /contact) + WhatsApp link + embedded Google Map optional
- **FAQ:** accordion (shipping times, exchange policy, sizing, payment)
- **Shipping & Delivery / Returns & Exchange:** clean prose pages, policy lists
- **Privacy / Terms:** standard text

---

## 3. Admin pages (`/admin` — client-heavy, guarded by role)

### 3.1 Shell

- Left sidebar (collapsible; drawer on mobile): Dashboard · Products · Categories · Orders · Customers · Reports · Settings (Config, Profile) · "View store" link · logout
- Top bar: page title · search (orders/products) · admin avatar
- Active route highlight; permission = any admin (no RBAC)

### 3.2 Dashboard `/admin`

- Row of StatCards: Revenue today · Orders today · Revenue 30d · Pending orders · AOV · Low-stock count
- **Sales chart** (recharts area/bar, last 14 days) with date + revenue tooltips
- Two panels: **Recent orders** table (status badges, link) · **Low stock** list (product, variant, qty, restock link)
- Order status breakdown chips (clickable → filtered orders)

### 3.3 Products

**List `/admin/products`**

- Toolbar: search, status filter, category filter, "New product" button
- Table: thumb · name (+ slug) · category · price · total stock · status badge · flags (⭐ 🆕) · actions (edit, quick archive)
- Row click → edit; pagination

**Create/Edit `/admin/products/[id]` (or `new`)**

- Tabs or 2-column:
  - **Main:** name, category select, price, compareAtPrice, description (textarea w/ light markdown or simple HTML toolbar), brand, tags
  - **Variants:** dynamic rows table (size, color, sku auto-suggest, stock, priceOverride, active) + bulk-add helper ("sizes: 40-44 × colors: Black, Tan" generator)
  - **Images:** multi-upload (drag/drop → /admin/upload), reorder (drag), set primary, alt text field, delete
  - **Flags/status:** active/draft/archived, isFeatured, isNewArrival
  - **SEO:** metaTitle, metaDescription (+ auto preview)
- Save → validate → toast; slug auto-editable

### 3.4 Categories `/admin/categories`

- Tree list (indented), product counts, active toggle, drag-free ordering via sortOrder number input (simple)
- Side drawer/modal form: name, slug, parent select, image upload, description, meta, sortOrder
- Delete blocked with clear error when in use

### 3.5 Orders

**List `/admin/orders`**

- Filters: status tabs or select (All, Placed, Confirmed, Shipped, Delivered, Cancelled, Returned) + date range (from/to) + search (order #, phone, name)
- Table: orderNumber · date · customer name/phone · items count · total · status badge · quick action (view)
- Pagination; filter state in URL

**Detail `/admin/orders/[id]`**

- Header: orderNumber · status badge · date · print button
- **Status control:** current status + allowed next buttons (e.g. Confirmed → [Mark shipped] [Cancel]) + optional note input → confirm dialog → PATCH; disabled/hidden if no allowed transitions
- **Timeline:** vertical statusHistory (status, note, by, time)
- Customer card: name, phone, email (link tel:)
- Address card (copy button)
- Items table: image, name, size/color, price, qty, line total
- Pricing card: subtotal, shipping, total, payment method/status
- Internal note textarea (save)
- Print packing slip: `@media print` CSS (hide sidebar/chrome)

### 3.6 Customers `/admin/customers`

- List: name, phone, email, orders count, total spent, joined, status
- Detail: profile + addresses + orders table (links)

### 3.7 Reports `/admin/reports`

- Date range picker (presets: 7d, 30d, this month, custom)
- Summary cards: revenue, orders, AOV, units sold
- Chart: revenue by day
- Top products table (qty, revenue)
- Orders by status breakdown
- "Export CSV" button (client-generated from report data)

### 3.8 Settings

**Config `/admin/settings/config`** — grouped forms:

- Store: name, tagline, phone, email, address, WhatsApp, socials
- Shipping: flatRate, freeAbove, estimatedDays, codEnabled, allowGuest
- Inventory: lowStockThreshold
- Announcement bar: enabled + text
- Save → PUT /admin/config → toast

**Profile `/admin/settings/profile`:** name, email, phone + change password

---

## 4. Shared UX rules

| Rule           | Detail                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Loading        | Skeletons on first load; buttons show spinner when pending                                                                                |
| Empty          | Every list: illustration/icon + message + primary CTA                                                                                     |
| Errors         | Toast (global) for actions; inline field errors for forms; banner for 409/429                                                             |
| Destructive    | Confirm modal (cancel order, delete category, archive product)                                                                            |
| Money format   | `Rs 2,499` via shared `formatPKR()`                                                                                                       |
| Dates          | Storefront: `12 Oct 2026`; admin: `12 Oct 2026, 3:45 PM (PKT)`                                                                            |
| Status badges  | consistent colors across storefront & admin: placed=gray, confirmed=blue, shipped=indigo, delivered=green, cancelled=red, returned=orange |
| Responsiveness | admin tables → stacked cards under 768px                                                                                                  |
| A11y           | labeled inputs, focus-visible rings, aria on modals/drawers, keyboard cart/size selection                                                 |
| Theme          | light only (dark mode not in scope)                                                                                                       |

---

## 5. Route guard matrix

| Route                                                    | Guest   | Customer | Admin | Fail behavior             |
| -------------------------------------------------------- | ------- | -------- | ----- | ------------------------- |
| `/`, `/products*`, `/categories*`, `/search`, info pages | ✓       | ✓        | ✓     | —                         |
| `/cart`, `/checkout`                                     | ✓ (COD) | ✓        | ✓     | empty cart → /cart        |
| `/account/*`, `/orders/me`                               | ✗       | ✓        | ✓     | → `/login?next=`          |
| `/admin/*`                                               | ✗       | ✗        | ✓     | → `/login?next=/admin`    |
| Admin API                                                | ✗       | ✗        | ✓     | 403 → UI toast + redirect |
