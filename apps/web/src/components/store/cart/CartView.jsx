'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, X, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPKR } from '@/lib/format';
import { shippingFor } from '@/lib/checkout';
import EmptyState from '@/components/ui/EmptyState';

export default function CartView({ shipping }) {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const ship = shippingFor(subtotal, shipping);

  if (!items.length) {
    return (
      <div className="container-app py-12">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">Your Cart</h1>
        <EmptyState
          title="Your cart is empty"
          message="Browse our collection and add something you love."
          actionLabel="Start shopping"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8 lg:py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="kicker">Shopping bag</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">Your Cart</h1>
        </div>
        <span className="text-sm text-ink-soft">
          {items.reduce((n, i) => n + i.qty, 0)} item{items.reduce((n, i) => n + i.qty, 0) === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => {
            const overStock = item.qty >= item.maxStock;
            return (
              <div
                key={item.key}
                className="card flex gap-4 p-4 transition-colors relative"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface sm:h-24 sm:w-24"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-700"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-ink-soft">
                        Size {item.size} · {item.color}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-mute">{formatPKR(item.price)} each</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex h-9 items-center rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="flex h-full w-9 items-center justify-center text-ink-soft hover:text-brand-700"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        disabled={overStock}
                        aria-label="Increase quantity"
                        className="flex h-full w-9 items-center justify-center text-ink-soft hover:text-brand-700 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink">{formatPKR(item.price * item.qty)}</p>
                      {overStock && (
                        <p className="text-[11px] font-medium text-amber-600">
                          Only {item.maxStock} in stock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Continue shopping
          </Link>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink">Order Summary</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPKR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className={`font-medium ${ship.free ? 'text-emerald-600' : 'text-ink'}`}>
                  {ship.label}
                </dd>
              </div>
              {ship.free && (
                <p className="text-xs text-emerald-600">
                  You saved Rs {(shipping?.flatRate || 0).toLocaleString()} on shipping
                </p>
              )}
              {!ship.free && shipping?.freeAbove > 0 && (
                <p className="text-xs text-ink-mute">
                  Add {formatPKR(shipping.freeAbove - subtotal)} more for free shipping
                </p>
              )}
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-extrabold text-ink">{formatPKR(subtotal + ship.cost)}</dd>
              </div>
            </dl>

            <Link href="/checkout" className="btn-primary mt-5 w-full !py-3">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              Cash on Delivery — pay when you receive
            </p>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink-soft">
            <ShoppingBag className="h-4 w-4 text-brand-600" />
            Secure checkout · 7-day exchange
          </div>
        </aside>
      </div>
    </div>
  );
}
