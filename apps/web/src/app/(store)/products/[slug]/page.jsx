import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPKR } from '@/lib/format';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Gallery from '@/components/store/pdp/Gallery';
import BuyBox from '@/components/store/pdp/BuyBox';
import ProductCard from '@/components/store/ProductCard';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

async function getProduct(slug) {
  try {
    return await api(`/products/${slug}`, { next: { revalidate: 30 } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: 'Product not found' };

  const { product } = data;
  const title = product.metaTitle || `${product.name} — Buy Online`;
  const description =
    product.metaDescription ||
    product.description?.slice(0, 155) ||
    `${product.name} — ${formatPKR(product.price)}. Cash on delivery all over Pakistan.`;
  const image = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, related } = data;
  const inStock = product.variants.some((v) => v.isActive !== false && v.stock > 0);

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.slice(0, 500) || undefined,
    image: product.images?.map((i) => i.url) || [],
    brand: { '@type': 'Brand', name: product.brand || 'SIS' },
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: 'PKR',
      price: product.price,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category?.name,
        item: `${siteUrl}/categories/${product.category?.slug}`,
      },
      { '@type': 'ListItem', position: 3, name: product.name },
    ],
  };

  return (
    <div className="container-app py-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Products', href: '/products' },
          { name: product.category?.name || 'Category', href: `/categories/${product.category?.slug}` },
          { name: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={product.images} alt={product.name} />
        <BuyBox product={product} />
      </div>

      {/* Details */}
      <div className="mt-12 grid gap-8 border-t border-line pt-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-lg font-bold text-ink">Product Details</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
            {(product.description || '')
              .split('\n')
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>

          <div className="mt-6 space-y-2">
            <details className="group rounded-lg border border-line px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
                Materials &amp; Care
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Made with quality leather and durable soles. Wipe clean with a soft dry cloth.
                Avoid prolonged exposure to water. Store in a cool, dry place.
              </p>
            </details>
            <details className="group rounded-lg border border-line px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
                Shipping &amp; Delivery
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Cash on Delivery available all over Pakistan. Delivery takes 3-5 working days.
                Shipping fee is shown at checkout.
              </p>
            </details>
            <details className="group rounded-lg border border-line px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
                Exchange Policy
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Exchange within 7 days for unused items in original condition. Contact us with your
                order number to arrange an exchange.
              </p>
            </details>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold text-ink">Size Guide</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Available sizes: {product.variants.map((v) => v.size).filter((v, i, a) => a.indexOf(v) === i).join(', ')}.
            Standard Pakistani fitting — if you are between sizes, we recommend going one size up.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Need help? Contact us →
          </Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-ink">Related Products</h2>
            <Link
              href={`/categories/${product.category?.slug}`}
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
