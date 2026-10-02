'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Copy, Truck, ArrowRight, Package } from 'lucide-react';
import { formatPKR } from '@/lib/format';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderNumber = params.orderNumber;
  const [copied, setCopied] = useState(false);
  const cache = useRef({ raw: null, value: null });

  const subscribe = useCallback(() => () => {}, []);
  const getSnapshot = useCallback(() => {
    let raw = null;
    try {
      raw = window.sessionStorage.getItem('sis-last-order');
    } catch {
      /* ignore */
    }
    if (cache.current.raw === raw) return cache.current.value;
    let value = null;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.orderNumber === orderNumber) value = parsed;
    } catch {
      /* ignore */
    }
    cache.current = { raw, value };
    return value;
  }, [orderNumber]);
  const order = useSyncExternalStore(subscribe, getSnapshot, () => null);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!order) {
    return (
      <div className="container-app flex justify-center py-16">
        <div className="card w-full max-w-lg p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-4 text-xl font-bold text-ink">Order details not found</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Look up your order anytime with your order number and phone.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/track-order" className="btn-primary">
              Track your order
            </Link>
            <Link href="/" className="btn-outline">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app flex justify-center py-10 lg:py-14">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Thank you{order.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-2 text-sm text-ink-soft">Your order has been placed successfully.</p>

          <button
            type="button"
            onClick={copyNumber}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition-colors hover:border-brand-400"
          >
            {orderNumber}
            <Copy className="h-3.5 w-3.5 text-ink-mute" />
            {copied && <span className="text-xs font-medium text-emerald-600">Copied!</span>}
          </button>
        </div>

        <div className="card mt-8 p-5 sm:p-6">
          <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <Truck className="h-5 w-5 shrink-0 text-brand-700" />
            <p className="text-sm text-brand-900">
              Pay <span className="font-bold">{formatPKR(order.pricing.total)}</span> in cash on
              delivery
              {order.estimatedDelivery && (
                <>
                  {' · '}estimated by{' '}
                  <span className="font-semibold">
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </>
              )}
            </p>
          </div>

          <ul className="mt-5 space-y-3">
            {order.items?.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-semibold text-ink">{item.name}</span>
                  <span className="text-xs text-ink-soft">
                    Size {item.size} · {item.color} · ×{item.qty}
                  </span>
                </span>
                <span className="text-sm font-semibold text-ink">{formatPKR(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatPKR(order.pricing.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className={order.pricing.shippingCost === 0 ? 'text-emerald-600' : ''}>
                {order.pricing.shippingCost === 0 ? 'FREE' : formatPKR(order.pricing.shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold text-ink">Total (COD)</dt>
              <dd className="font-extrabold text-ink">{formatPKR(order.pricing.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/track-order" className="btn-primary flex-1">
            Track Order
          </Link>
          <Link href="/products" className="btn-outline flex-1">
            Continue shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
