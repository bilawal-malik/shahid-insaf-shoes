import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/store/ProductCard';
import FilterContent from '@/components/store/catalog/FilterContent';
import MobileFilters from '@/components/store/catalog/MobileFilters';
import SortSelect from '@/components/store/catalog/SortSelect';
import { spToProductQuery } from '@/lib/catalog';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const { category } = await api(`/categories/${slug}`);
    return {
      title: category.metaTitle || `${category.name} — Shoes & Sandals`,
      description:
        category.metaDescription ||
        category.description ||
        `Shop ${category.name} from SIS — handcrafted quality footwear with cash on delivery.`,
      alternates: { canonical: `/categories/${slug}` },
      openGraph: {
        title: category.name,
        images: category.image?.url ? [category.image.url] : undefined,
      },
    };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;

  let data;
  try {
    data = await api(`/categories/${slug}`);
  } catch {
    notFound();
  }

  const query = spToProductQuery({ ...sp, category: slug });
  const [products, categoriesRes] = await Promise.all([
    api(`/products?${query}`).catch(() => null),
    api('/categories', { next: { revalidate: 60 } }).catch(() => ({ items: [] })),
  ]);

  const categories = categoriesRes.items || [];
  const items = products?.items || [];

  const categoryLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.category.name,
    description: data.category.description || undefined,
  };

  return (
    <div className="container-app py-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryLd) }}
      />

      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Products', href: '/products' },
          ...data.breadcrumb.map((b, i) =>
            i === data.breadcrumb.length - 1
              ? { name: b.name }
              : { name: b.name, href: `/categories/${b.slug}` }
          ),
        ]}
      />

      {data.category.image?.url && (
        <div className="relative mb-6 aspect-[16/6] overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={data.category.image.url}
            alt={data.category.image.alt || data.category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/80 via-brand-950/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-center p-6 sm:p-10">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {data.category.name}
            </h1>
            {data.category.description && (
              <p className="mt-2 hidden text-sm text-white/85 sm:block">
                {data.category.description}
              </p>
            )}
          </div>
        </div>
      )}

      {!data.category.image?.url && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {data.category.name}
          </h1>
        </div>
      )}

      {data.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {data.children.map((child) => (
            <Link
              key={child._id}
              href={`/categories/${child.slug}`}
              className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="card sticky top-28 p-5">
            <FilterContent categories={categories} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              {products ? `${products.total} products` : 'Loading...'}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters categories={categories} />
              <SortSelect />
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <Pagination
                page={products.page}
                pages={products.pages}
                searchParams={sp}
                basePath={`/categories/${slug}`}
              />
            </>
          ) : (
            <EmptyState
              title="No products in this category yet"
              message="Check back soon — or browse our full collection."
              actionLabel="Browse all products"
              actionHref="/products"
            />
          )}
        </div>
      </div>
    </div>
  );
}
