'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

export default function CustomersView() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ page: 1, items: null, pages: 1, total: 0 });

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q.trim()) params.set('q', q.trim());

    const timer = setTimeout(() => {
      apiClient(`/admin/customers?${params}`)
        .then((r) => {
          if (alive) setState({ page: r.page, items: r.items, pages: r.pages, total: r.total });
        })
        .catch((err) => {
          if (alive) {
            setState((s) => ({ ...s, items: [] }));
            toast(err.message || 'Could not load customers', 'error');
          }
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, page, toast]);

  const items = state.items;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className="input pl-9"
            placeholder="Search name, email or phone…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
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
          <Users className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-3 text-lg font-bold text-ink">No customers found</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {q ? 'Try a different search.' : 'Registered customers appear here.'}
          </p>
        </div>
      )}

      {items?.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 text-right font-semibold">Orders</th>
                <th className="px-4 py-3 text-right font-semibold">Total spent</th>
                <th className="px-4 py-3 font-semibold">Last order</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((c) => (
                <tr key={c._id} className="transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c._id}`} className="min-w-0">
                      <span className="block truncate font-semibold text-ink hover:text-brand-700">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-ink-mute">{c.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.orderCount || 0}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {formatPKR(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge border ${
                        c.isActive === false
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {c.isActive === false ? 'disabled' : 'active'}
                    </span>
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
            Page {state.page} of {state.pages} · {state.total} customers
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
