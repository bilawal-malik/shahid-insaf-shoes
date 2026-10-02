'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export default function CartBadge() {
  const count = useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState().items.reduce((n, i) => n + i.qty, 0),
    () => 0
  );

  return (
    <Link
      href="/cart"
      aria-label={`Cart${count ? `, ${count} items` : ''}`}
      className="relative p-2 text-ink transition-colors hover:text-brand-700"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
