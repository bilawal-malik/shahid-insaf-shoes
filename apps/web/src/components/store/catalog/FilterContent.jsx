'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export const SIZES = ['39', '40', '41', '42', '43', '44', '45'];
export const COLORS = ['Black', 'Brown', 'Tan', 'White'];

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0">
      <p className="mb-3 text-sm font-semibold text-ink">{title}</p>
      {children}
    </div>
  );
}

export function useFilterUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = (mutate) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const update = (key, value) => {
    push((params) => {
      if (value === null || value === undefined || value === '') params.delete(key);
      else params.set(key, String(value));
      if (key !== 'page') params.delete('page');
    });
  };

  const updateMany = (entries) => {
    push((params) => {
      for (const [key, value] of Object.entries(entries)) {
        if (value === null || value === undefined || value === '') params.delete(key);
        else params.set(key, String(value));
        if (key !== 'page') params.delete('page');
      }
    });
  };

  const clearAll = () => router.push(pathname);
  const isActive = (key, value) => searchParams.get(key) === value;
  const activeCount = ['category', 'size', 'color', 'minPrice', 'maxPrice'].filter((k) =>
    searchParams.get(k)
  ).length;

  return { searchParams, update, updateMany, clearAll, isActive, activeCount };
}

export default function FilterContent({ categories = [] }) {
  const { searchParams, update, updateMany, clearAll, isActive, activeCount } = useFilterUpdater();

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Filters</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup title="Category">
        <ul className="space-y-1.5 text-sm">
          <li>
            <button
              type="button"
              onClick={() => update('category', null)}
              className={
                !searchParams.get('category')
                  ? 'font-medium text-brand-700'
                  : 'text-ink-soft transition-colors hover:text-ink'
              }
            >
              All categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat._id}>
              <button
                type="button"
                onClick={() => update('category', cat.slug)}
                className={
                  isActive('category', cat.slug)
                    ? 'font-medium text-brand-700'
                    : 'text-ink-soft transition-colors hover:text-ink'
                }
              >
                {cat.name}
              </button>
              {cat.children?.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1.5">
                  {cat.children.map((child) => (
                    <li key={child._id}>
                      <button
                        type="button"
                        onClick={() => update('category', child.slug)}
                        className={
                          isActive('category', child.slug)
                            ? 'font-medium text-brand-700'
                            : 'text-ink-soft transition-colors hover:text-ink'
                        }
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update('size', isActive('size', size) ? null : size)}
              className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-medium transition-colors ${
                isActive('size', size)
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-line text-ink-soft hover:border-brand-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        <div className="flex flex-wrap items-center gap-2.5">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`Filter by ${color}`}
              onClick={() => update('color', isActive('color', color) ? null : color)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                {
                  Black: 'bg-black',
                  Brown: 'bg-[#6b4423]',
                  Tan: 'bg-[#d2a679]',
                  White: 'bg-white',
                }[color]
              } ${
                isActive('color', color) ? 'border-brand-700 ring-2 ring-brand-200' : 'border-line'
              }`}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price (Rs)">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            updateMany({ minPrice: form.get('minPrice'), maxPrice: form.get('maxPrice') });
          }}
          className="flex items-center gap-2"
        >
          <input
            name="minPrice"
            type="number"
            min="0"
            placeholder="Min"
            defaultValue={searchParams.get('minPrice') || ''}
            className="input !px-2.5 !py-2 text-xs"
            aria-label="Minimum price"
          />
          <span className="text-ink-mute">-</span>
          <input
            name="maxPrice"
            type="number"
            min="0"
            placeholder="Max"
            defaultValue={searchParams.get('maxPrice') || ''}
            className="input !px-2.5 !py-2 text-xs"
            aria-label="Maximum price"
          />
          <button type="submit" className="btn-outline !px-3 !py-2 text-xs">
            Go
          </button>
        </form>
      </FilterGroup>
    </div>
  );
}
