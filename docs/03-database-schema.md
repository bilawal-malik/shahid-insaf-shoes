# 03 — Database Schema (MongoDB / Mongoose)

**Conventions**

- All money in **PKR**, `Number` with 2 decimals (e.g. `2499.00`)
- Timestamps on every collection (`createdAt`, `updatedAt`)
- `_id` = ObjectId; human-facing IDs: `orderNumber` (orders only)
- Slugs: unique sparse index where present
- Soft-delete/archive flags instead of hard deletes for catalogue
- Status enums match PRD section 5

> Field lists below are the contract. Mongoose schemas must match exactly; deviations require doc update first.

---

## 1. `users`

Two roles in one collection: `customer` | `admin`.

```js
{
  name: String, required, trim
  email: String, required, unique, lowercase, trim      // admin must have unique email
  phone: String, trim                                   // required for customers, optional admin
  password: String, required, select: false             // bcrypt hash, min 8
  role: String, enum ['customer','admin'], default 'customer'
  isActive: Boolean, default true                       // block bad accounts
  addresses: [{
    _id: ObjectId,
    label: String            // 'Home', 'Office'
    fullName: String
    phone: String
    line1: String            // street / house
    line2: String?           // area / landmark
    city: String
    province: String
    postalCode: String?
    isDefault: Boolean, default false
  }],
  lastLoginAt: Date?
}
```

Indexes: `email` unique; `phone`; `role + createdAt` (admin list).

---

## 2. `categories` (self-referencing tree)

```js
{
  name: String, required
  slug: String, required, unique
  description: String?
  image: { url: String?, alt: String?, publicId: String? }
  parent: ObjectId? → categories      // null = top-level
  sortOrder: Number, default 0        // sibling ordering
  isActive: Boolean, default true
  metaTitle: String?                  // SEO override
  metaDescription: String?
}
```

Indexes: `slug` unique; `parent + sortOrder`; `isActive + sortOrder`.
**Rule:** cannot delete category with products or children (must reassign).

---

## 3. `products`

```js
{
  name: String, required
  slug: String, required, unique
  description: String, default ''                 // plain text / light HTML from editor
  category: ObjectId, required → categories
  brand: String?, default 'SIS'
  tags: [String]

  price: Number, required                         // current selling price PKR
  compareAtPrice: Number?                         // optional original price (> price → discount badge)
  currency: 'PKR', default 'PKR'

  variants: [{
    _id: ObjectId,
    size: String, required                        // '40','41',... or 'One Size'
    color: String, required                       // 'Black','Tan',...
    sku: String?, unique sparse                   // auto: {slug}-{size}-{color}
    stock: Number, required, min 0, default 0
    priceOverride: Number?                        // rare per-variant pricing
    isActive: Boolean, default true
  }]

  images: [{
    url: String, required                         // Cloudinary secure URL
    publicId: String                              // for deletion
    alt: String?, default ''                      // SEO: required before publish (app check)
    isPrimary: Boolean, default false             // exactly one true
  }]

  status: enum ['active','draft','archived'], default 'draft'
  isFeatured: Boolean, default false
  isNewArrival: Boolean, default false
  soldCount: Number, default 0                    // denormalized for "popularity" sort

  metaTitle: String?
  metaDescription: String?
}
```

Indexes:

- `slug` unique
- `category + status + createdAt`
- `status + isFeatured`, `status + isNewArrival`
- `status + price`, `status + soldCount` (sorts)
- text index on `name + tags + description` (search fallback) — or use regex search v1

**Derived (not stored):** `totalStock = Σ variants.stock`; available = status active && totalStock > 0.

**Display price** = variant `priceOverride ?? product.price`.

---

## 4. `orders`

```js
{
  orderNumber: String, required, unique      // 'SIS-2026-00042' (sequence via counters collection)
  user: ObjectId? → users                    // null = guest
  isGuest: Boolean, default true

  customer: {                                // snapshot at checkout (never changes if user edits profile)
    name: String, required
    phone: String, required
    email: String?
  }
  shippingAddress: {
    fullName, phone, line1, line2?, city, province, postalCode?
  }  // embedded (address snapshot — critical)

  items: [{
    product: ObjectId → products             // reference
    name: String, snapshot
    slug: String, snapshot
    image: String?, snapshot (primary image url)
    size: String, color: String
    sku: String?
    price: Number, snapshot (unit price used)
    qty: Number, min 1
    lineTotal: Number                         // price * qty
  }]

  pricing: {
    subtotal: Number,
    shippingCost: Number,
    discount: Number, default 0,             // future coupon; 0 now
    total: Number                             // subtotal + shipping - discount
  }

  payment: {
    method: enum ['cod'], default 'cod'      // future: 'card','wallet','bank'
    status: enum ['pending','paid','failed','refunded'], default 'pending'
    // COD: stays 'pending' until delivered → admin/cron may flip to 'paid'
    transactionId: String?                    // future gateway ref
    paidAt: Date?
  }

  status: enum ['placed','confirmed','shipped','delivered','cancelled','returned'],
          default 'placed'

  statusHistory: [{
    status: String,
    note: String?,                            // internal admin note
    by: ObjectId? → users                     // null for system
    at: Date, default now
  }]

  internalNote: String?                       // freeform latest note
  estimatedDelivery: Date?                    // optional admin set
  cancelledAt: Date?
  cancelReason: String?

  stockAdjusted: Boolean, default false       // guard against double stock restore
}
```

Indexes:

- `orderNumber` unique
- `createdAt` desc (listing)
- `status + createdAt`
- `phone` (guest lookup + search)
- `user + createdAt` (account history)

**Order lookup (public):** `GET /orders/lookup?orderNumber=&phone=` → only non-sensitive fields + timeline.

**Status transitions** enforced in `orderService.transition()` (see 01 §5). Transition side-effects:

| Transition                          | Side effect                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| → placed                            | decrement variant stock for all items (fail → 409, no order created) |
| → cancelled (from placed/confirmed) | restore stock (if `stockAdjusted`)                                   |
| → returned                          | restore stock (if `stockAdjusted`)                                   |
| → delivered                         | set `payment.status = 'paid'` for COD (convention)                   |

---

## 5. `carts` (DB-backed; guest carts live in localStorage — no server cart for guests in v1)

```js
{
  user: ObjectId, required, unique → users   // one active cart per user
  items: [{
    product: ObjectId → products,
    variant: ObjectId,                       // variant._id
    qty: Number, min 1
    addedAt: Date
  }],
  updatedAt: Date
}
```

Index: `user` unique.
Server validates prices/stock at read & checkout time (cart stores only product+variant+qty).

---

## 6. `configs` (single-doc settings collection)

```js
{
  key: 'store', unique                       // single doc { key: 'store', ...fields }
  store: {
    name: 'SIS — Shahid Insaf Shoes',
    tagline: String,
    phone: String,
    email: String,
    address: String,
    whatsapp: String?,
    social: { facebook?, instagram?, tiktok? }
  },
  shipping: {
    flatRate: Number, default 250,           // PKR — ADMIN EDITABLE
    freeAbove: Number, default 0,            // 0 = never free
    codEnabled: Boolean, default true,
    estimatedDays: String, default '3-5'     // display copy
  },
  checkout: {
    allowGuest: Boolean, default true,
    lowStockThreshold: Number, default 5
  },
  announcement: {
    enabled: Boolean, default false,
    text: String
  }
}
```

Access: `configService.get()` with in-memory cache (invalidate on admin update).

---

## 7. `counters` (for human order numbers)

```js
{ _id: 'orderNumber', seq: Number }   // upsert $inc → 'SIS-{year}-{seq padded 5}'
```

One counter per year: `_id: 'orderNumber-2026'`.

---

## 8. ER summary

```
users 1────* orders *────1 products *────1 categories
users 1────1 carts *────1 products
orders.items = embedded snapshots (product refs + price/qty snapshots)
configs = 1 singleton doc
counters = tiny utility docs
```

**Relationship philosophy:** references for anything we query/join (`product`, `category`, `user`), **snapshots** for anything historical (`items`, `customer`, `shippingAddress`) so old orders never drift when catalogue changes.

---

## 9. Data integrity checklist

- [ ] Every write path validates enum statuses server-side
- [ ] Prices always re-read from DB at checkout (client price ignored)
- [ ] Stock decrement uses conditional update: `{"variants._id": vid, "variants.stock": {$gte: qty}}` to prevent oversell races
- [ ] Order creation: stock check + order insert done sequentially; on insert failure, restore already-decremented stock
- [ ] `select: false` on password everywhere
- [ ] Aggregation pipelines for dashboard KPIs (single round-trips)

---

## 10. Seed data (`npm run seed`)

1. 1 admin: `admin@sis.pk` / strong dev password (printed once)
2. Categories: Sandals → Peshawari Chappal, Kolhapuri; Shoes → Formal, Casual, Sneakers; Slippers
3. ~12 products with 3-5 images each (placeholder Cloudinary assets or local `/public/placeholder`), sizes 39-45, colors Black/Tan/Brown
4. 2-4 demo orders across statuses (for dashboard dev)
5. Default `configs` doc with `flatRate: 250`
6. Idempotent: skips if admin exists unless `--force`
