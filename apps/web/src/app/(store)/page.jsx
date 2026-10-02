import Image from 'next/image';
import Link from 'next/link';
import { Truck, ShieldCheck, RotateCcw, PhoneCall, ArrowRight, BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/store/ProductCard';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'SIS - Shahid Insaf Shoes';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=1400&q=80&auto=format&fit=crop';

export const metadata = {
  title: `${siteName} | Peshawari Chappals & Footwear Pakistan`,
  description:
    'Shop handcrafted Peshawari chappals, sandals and shoes from SIS. Cash on delivery, 3-5 day delivery all over Pakistan.',
  alternates: { canonical: '/' },
  openGraph: {
    title: siteName,
    description: 'Handcrafted Peshawari chappals, sandals and shoes. COD across Pakistan.',
    images: [HERO_IMAGE],
  },
};

async function getHomeData() {
  try {
    const [featured, newArrivals, popular, categories, config] = await Promise.all([
      api('/products/featured', { next: { revalidate: 60 } }),
      api('/products/new-arrivals', { next: { revalidate: 60 } }),
      api('/products?sort=popular&limit=4', { next: { revalidate: 60 } }),
      api('/categories', { next: { revalidate: 60 } }),
      api('/config', { next: { revalidate: 60 } }),
    ]);
    return {
      featured,
      newArrivals,
      popular,
      categories: categories.items || [],
      config,
    };
  } catch {
    return {
      featured: { items: [] },
      newArrivals: { items: [] },
      popular: { items: [] },
      categories: [],
      config: null,
    };
  }
}

function SectionHeader({ kicker, title, href = '/products', linkLabel = 'View all' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="kicker mb-1.5">{kicker}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      <Link
        href={href}
        className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink-soft shadow-sm transition-colors hover:border-brand-700 hover:text-brand-700 sm:flex"
      >
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ProductRow({ kicker, title, items, href }) {
  if (!items.length) return null;
  return (
    <section className="mt-14 sm:mt-16">
      <SectionHeader kicker={kicker} title={title} href={href} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}

const TRUST_ITEMS = [
  { icon: Truck, title: 'Cash on Delivery', text: 'Pay when your order arrives' },
  { icon: ShieldCheck, title: 'Quality Guaranteed', text: 'Premium leather & craftsmanship' },
  { icon: RotateCcw, title: '7-Day Exchange', text: 'Easy exchange on unused items' },
  { icon: PhoneCall, title: 'Real Support', text: 'Help via phone & WhatsApp' },
];

export default async function HomePage() {
  const { featured, newArrivals, popular, categories, config } = await getHomeData();
  const freeAbove = config?.shipping?.freeAbove || 0;

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-700/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl"
        />
        <div className="container-app relative grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-200">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              Handcrafted in Pakistan
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              Premium Peshawari Chappals &amp; Shoes
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-200 sm:text-lg">
              Traditional craftsmanship, genuine leather and all-day comfort — from SIS (Shahid
              Insaf Shoes) to your doorstep.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-brand-800 shadow-navy transition-all hover:bg-brand-50 active:scale-[0.98]"
              >
                Shop Now
              </Link>
              <Link
                href="/categories/sandals"
                className="rounded-lg border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-all hover:border-white/50 hover:bg-white/10 active:scale-[0.98]"
              >
                Browse Sandals
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-2.5 text-sm text-brand-200">
              {['Cash on Delivery', '3-5 day delivery', '7-day exchange'].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10 lg:aspect-[5/4]">
              <Image
                src={HERO_IMAGE}
                alt="Handcrafted leather footwear"
                fill
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {freeAbove > 0 && (
              <div className="absolute -bottom-4 left-4 rounded-xl border border-line bg-white px-4 py-3 shadow-card-hover sm:left-8">
                <p className="text-xs font-medium text-ink-mute">Free delivery on orders over</p>
                <p className="text-sm font-extrabold text-brand-800">
                  Rs {freeAbove.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-white">
        <div className="container-app grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Icon className="h-5 w-5 text-brand-700" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container-app pb-16">
        {/* Categories */}
        {categories.length > 0 && (
          <section className="mt-14">
            <SectionHeader
              kicker="Browse the range"
              title="Shop by Category"
              href="/products"
              linkLabel="All products"
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat._id}
                  href={`/categories/${cat.slug}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-900 shadow-card"
                >
                  {cat.image?.url && (
                    <Image
                      src={cat.image.url}
                      alt={cat.image.alt || cat.name}
                      fill
                      sizes="(max-width:768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                    <div>
                      <p className="text-base font-bold text-white">{cat.name}</p>
                      <p className="mt-0.5 text-xs text-brand-200">
                        {cat.productCount || 0} product{(cat.productCount || 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-white group-hover:text-brand-800">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <ProductRow
          kicker="Handpicked for you"
          title="Featured Products"
          items={featured.items}
          href="/products?featured=true"
        />
        <ProductRow
          kicker="Just landed"
          title="New Arrivals"
          items={newArrivals.items}
          href="/products?sort=newest"
        />
        <ProductRow
          kicker="Customer favourites"
          title="Best Sellers"
          items={popular.items}
          href="/products?sort=popular"
        />

        {/* Promo strip */}
        <section className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 to-brand-700 px-6 py-12 text-center sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl"
          />
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Quality footwear, honest prices
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-200 sm:text-base">
            Order with Cash on Delivery and pay when your order arrives. Delivered anywhere in
            Pakistan in 3-5 working days.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-brand-800 shadow-navy transition-all hover:bg-brand-50 active:scale-[0.98]"
          >
            Explore the collection <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </>
  );
}
