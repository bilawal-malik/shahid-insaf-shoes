import { api } from '@/lib/api';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/store/ProductCard';
import FilterContent from '@/components/store/catalog/FilterContent';
import MobileFilters from '@/components/store/catalog/MobileFilters';
import SortSelect from '@/components/store/catalog/SortSelect';
import { spToProductQuery } from '@/lib/catalog';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'SIS - Shahid Insaf Shoes';

export const metadata = {
  title: 'Shop All Shoes & Sandals',
  description:
    'Browse Peshawari chappals, sandals, formal shoes and slippers from SIS. Filter by size, color and price. Cash on delivery across Pakistan.',
  alternates: { canonical: '/products' },
  robots: { index: true, follow: true },
};

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const query = spToProductQuery(sp);

  const [data, categoriesRes] = await Promise.all([
    api(`/products?${query}`),
    api('/categories', { next: { revalidate: 60 } }),
  ]).catch(() => [null, { items: [] }]);

  const categories = categoriesRes.items || [];
  const items = data?.items || [];
  const activeCategory = categories
    .flatMap((c) => [c, ...(c.children || [])])
    .find((c) => c.slug === sp.category);

  return (
    <div className="container-app py-6 lg:py-8">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          ...(activeCategory ? [{ name: 'Products', href: '/products' }, { name: activeCategory.name }] : [{ name: 'All Products' }]),
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {activeCategory ? activeCategory.name : 'All Products'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          {data ? `${data.total} product${data.total === 1 ? '' : 's'}` : 'Loading products...'}
          {sp.size ? ` · Size ${sp.size}` : ''}
          {sp.color ? ` · ${sp.color}` : ''}
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="card sticky top-28 p-5">
            <FilterContent categories={categories} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <MobileFilters categories={categories} />
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs font-medium text-ink-mute sm:inline">Sort by</span>
              <SortSelect />
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <Pagination
                page={data.page}
                pages={data.pages}
                searchParams={sp}
                basePath="/products"
              />
            </>
          ) : (
            <EmptyState
              title="No products found"
              message="Try removing some filters or browse our full collection."
              actionLabel="Clear filters & browse all"
              actionHref="/products"
            />
          )}
        </div>
      </div>

      <p className="mt-10 text-xs text-ink-mute">
        Need help choosing? Call or WhatsApp us — see links in the footer. · {siteName.split(' - ')[0]}
      </p>
    </div>
  );
}
