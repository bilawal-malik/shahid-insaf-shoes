'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertTriangle,
  ReceiptText,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR } from '@/lib/format';

const STATUS_BADGES = {
  placed: 'bg-gray-100 text-gray-700 border-gray-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
          <Icon className="h-5 w-5 text-brand-700" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-mute">
            {label}
          </p>
          <p className="text-lg font-extrabold leading-tight text-ink">{value}</p>
          {sub && <p className="text-xs text-ink-soft">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    apiClient('/admin/dashboard')
      .then((r) => {
        if (alive) setData(r);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Could not load dashboard');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/70" />
        ))}
      </div>
    );
  }

  const { kpi, salesChart, recentOrders, lowStock, lowStockThreshold } = data;
  const maxRevenue = Math.max(...salesChart.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={IndianRupee}
          label="Revenue today"
          value={formatPKR(kpi.revenueToday)}
          sub={`${kpi.ordersToday} order${kpi.ordersToday === 1 ? '' : 's'} today`}
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue (30d)"
          value={formatPKR(kpi.revenue30d)}
          sub={`${kpi.orders30d} orders`}
        />
        <StatCard
          icon={Clock}
          label="Pending orders"
          value={kpi.pendingOrders}
          sub="placed + confirmed"
        />
        <StatCard
          icon={ReceiptText}
          label="AOV (30d)"
          value={formatPKR(kpi.aov)}
          sub="average order value"
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders (7d)"
          value={kpi.orders7d}
          sub={formatPKR(kpi.revenue7d)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={kpi.lowStockCount}
          sub={`threshold ≤ ${lowStockThreshold}`}
        />
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink">Revenue — last 14 days</h2>
        <div className="mt-4 flex h-40 items-end gap-1.5">
          {salesChart.length === 0 && (
            <p className="self-center text-sm text-ink-soft">No orders in this period.</p>
          )}
          {salesChart.map((d) => (
            <div
              key={d.date}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="hidden rounded bg-brand-950 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">
                {formatPKR(d.revenue)}
              </span>
              <div
                className="w-full rounded-t bg-brand-700 transition-colors group-hover:bg-brand-800"
                style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 3)}%` }}
                title={`${d.date}: ${formatPKR(d.revenue)} · ${d.orders} orders`}
              />
              <span className="text-[9px] text-ink-mute">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-sm font-bold text-ink">Recent orders</h2>
          <ul className="mt-3 divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o._id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{o.orderNumber}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {o.customerName} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'} ·{' '}
                    {new Date(o.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`badge border ${STATUS_BADGES[o.status] || ''}`}>
                    {o.status}
                  </span>
                  <span className="text-sm font-bold text-ink">{formatPKR(o.total)}</span>
                </div>
              </li>
            ))}
            {recentOrders.length === 0 && (
              <li className="py-6 text-center text-sm text-ink-soft">No orders yet.</li>
            )}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-bold text-ink">Low stock</h2>
          <ul className="mt-3 divide-y divide-line">
            {lowStock.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{l.product.name}</p>
                  <p className="text-xs text-ink-soft">
                    Size {l.variant.size} · {l.variant.color}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`text-sm font-bold ${l.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}
                  >
                    {l.stock} left
                  </span>
                  <Link
                    href={`/admin/products/${l.product._id}`}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Restock
                  </Link>
                </div>
              </li>
            ))}
            {lowStock.length === 0 && (
              <li className="py-6 text-center text-sm text-ink-soft">
                All products are above the low-stock threshold.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
