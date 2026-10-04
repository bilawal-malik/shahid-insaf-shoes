'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, ReceiptText, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

const STATUS_BADGES = {
  placed: 'bg-gray-100 text-gray-700 border-gray-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
};

const STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function OrdersListView() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ page: 1, items: null, pages: 1, total: 0 });

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q.trim()) params.set('q', q.trim());
    if (status !== 'all') params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const timer = setTimeout(() => {
      apiClient(`/admin/orders?${params}`)
        .then((r) => {
          if (alive) setState({ page: r.page, items: r.items, pages: r.pages, total: r.total });
        })
        .catch((err) => {
          if (alive) {
            setState((s) => ({ ...s, items: [] }));
            toast(err.message || 'Could not load orders', 'error');
          }
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, status, from, to, page, toast]);

  const items = state.items;
  const filtered = Boolean(q || status !== 'all' || from || to);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className="input pl-9"
            placeholder="Order number, phone or name…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          From
          <input
            type="date"
            className="input w-auto !py-2"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          To
          <input
            type="date"
            className="input w-auto !py-2"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {items === null && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/70" />
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <div className="card p-12 text-center">
          <ReceiptText className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-3 text-lg font-bold text-ink">No orders found</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {filtered
              ? 'Try adjusting your search or filters.'
              : 'Orders appear here as customers check out.'}
          </p>
        </div>
      )}

      {items?.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 text-right font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((o) => (
                <tr key={o._id} className="transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="font-semibold text-ink hover:text-brand-700"
                    >
                      {o.orderNumber}
                    </Link>
                    {o.isGuest && (
                      <span className="ml-1.5 rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-mute">
                        guest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatDate(o.createdAt, { withTime: true })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">{o.customer?.name}</span>
                    <span className="block text-xs text-ink-mute">{o.customer?.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-soft">{o.itemCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {formatPKR(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${STATUS_BADGES[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        title="View order"
                        className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline !px-4 !py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-soft">
            Page {state.page} of {state.pages} · {state.total} orders
          </span>
          <button
            type="button"
            disabled={page >= state.pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-outline !px-4 !py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
