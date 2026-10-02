'use client';

import { useFilterUpdater } from './FilterContent';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function SortSelect() {
  const { searchParams, update } = useFilterUpdater();
  const current = searchParams.get('sort') || 'newest';

  return (
    <select
      value={current}
      onChange={(e) => update('sort', e.target.value)}
      aria-label="Sort products"
      className="input !w-auto !py-2 text-xs sm:text-sm"
    >
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
