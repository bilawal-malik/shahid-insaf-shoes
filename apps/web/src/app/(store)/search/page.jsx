import Link from 'next/link';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/store/ProductCard';
import Pagination from '@/components/ui/Pagination';
import { spToProductQuery } from '@/lib/catalog';

export const metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
};

const SUGGESTIONS = ['Peshawari Chappal', 'Sandal', 'Slippers', 'Formal Shoes'];

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();

  let data = null;
  if (q) {
    data = await api(`/search?${spToProductQuery(sp, { limit: 12 })}`).catch(() => null);
  }

  const items = data?.items || [];

  return (
    <div className="container-app py-6 lg:py-8">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Search' }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Search</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          {q ? (
            <>
              {data?.total ?? items.length} result{data?.total === 1 ? '' : 's'} for{' '}
              <span className="font-medium text-ink">&quot;{q}&quot;</span>
            </>
          ) : (
            'Type a search term in the header search bar.'
          )}
        </p>
      </div>

      {q && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} searchParams={sp} basePath="/search" />
        </>
      )}

      {q && items.length === 0 && (
        <EmptyState
          title={`No results for “${q}”`}
          message="Try different keywords, or browse one of these:"
          actionLabel="Browse all products"
          actionHref="/products"
        >
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
              >
                {s}
              </Link>
            ))}
          </div>
        </EmptyState>
      )}
    </div>
  );
}
