'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR } from '@/lib/format';
import StatusTracker from '@/components/store/StatusTracker';

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(() => searchParams.get('order') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const query = new URLSearchParams({
        orderNumber: orderNumber.trim(),
        phone: phone.trim(),
      });
      const res = await apiClient(`/orders/lookup?${query}`);
      setOrder(res.order);
    } catch (err) {
      setError(
        err.body?.error?.message ||
          'No order found with those details. Check your order number and phone number.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app py-10 lg:py-14">
      <div className="mx-auto max-w-xl text-center">
        <p className="kicker">Order status</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Track your order
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Enter your order number (e.g. SIS-2026-00005) and the mobile number you checked out with.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-xl">
        <div className="card grid gap-3 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="label">Order number</span>
            <input
              className="input"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="SIS-2026-00005"
              required
            />
          </label>
          <label className="block">
            <span className="label">Mobile number</span>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XXXXXXXXX"
              inputMode="tel"
              required
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary !py-3 sm:col-span-2">
            <Search className="h-4 w-4" />
            {loading ? 'Searching…' : 'Track Order'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mx-auto mt-4 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {order && (
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="card p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                  <Package className="h-5 w-5 text-brand-700" />
                </span>
                <div>
                  <p className="text-base font-bold text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-ink-soft">
                    Placed{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
              <p className="text-sm">
                <span className="text-ink-soft">Total: </span>
                <span className="font-bold text-ink">{formatPKR(order.pricing.total)}</span>
                <span className="text-xs text-ink-mute"> (COD)</span>
              </p>
            </div>

            <div className="mt-5">
              <StatusTracker
                status={order.status}
                history={order.statusHistory}
                estimatedDelivery={order.estimatedDelivery}
              />
            </div>

            {order.items?.length > 0 && (
              <div className="mt-5 rounded-xl bg-surface p-4 text-sm">
                <p className="font-semibold text-ink">Items</p>
                <ul className="mt-2 space-y-1.5">
                  {order.items.map((i) => (
                    <li
                      key={`${i.name}|${i.size}|${i.lineTotal}`}
                      className="flex justify-between gap-3 text-ink-soft"
                    >
                      <span className="truncate">
                        {i.name}
                        {i.size ? ` · ${i.size}` : ''} × {i.qty}
                      </span>
                      <span className="shrink-0 font-medium text-ink">
                        {formatPKR(i.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
