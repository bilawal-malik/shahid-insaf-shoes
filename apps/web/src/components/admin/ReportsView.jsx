'use client';

import { useEffect, useState } from 'react';
import { Download, IndianRupee, ShoppingBag, ReceiptText, Boxes } from 'lucide-react';
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

function iso(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(
    x.getDate()
  ).padStart(2, '0')}`;
}

function presetRange(key) {
  const now = new Date();
  const today = iso(now);
  if (key === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { from: iso(from), to: today };
  }
  if (key === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { from: iso(from), to: today };
  }
  if (key === 'month') {
    return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
  return { from: '', to: '' };
}

function StatCard({ icon: Icon, label, value }) {
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
        </div>
      </div>
    </div>
  );
}

export default function ReportsView() {
  const toast = useToast();
  const [preset, setPreset] = useState('30d');
  const [range, setRange] = useState(() => presetRange('30d'));
  const [result, setResult] = useState({ key: '', sales: null, top: null });
  const [exporting, setExporting] = useState(false);

  const { from, to } = range;
  const key = `${from}|${to}`;

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    Promise.all([
      apiClient(`/admin/reports/sales?${qs}`),
      apiClient(`/admin/reports/top-products?${qs}&limit=10`)
        .then((r) => r.items)
        .catch(() => []),
    ])
      .then(([sales, top]) => {
        if (alive) setResult({ key, sales, top });
      })
      .catch((err) => {
        if (alive) {
          setResult({ key, sales: null, top: null });
          toast(err.message || 'Could not load report', 'error');
        }
      });
    return () => {
      alive = false;
    };
  }, [key, from, to, toast]);

  const fresh = result.key === key;
  const sales = fresh ? result.sales : null;
  const top = fresh ? result.top : null;

  function applyPreset(key) {
    setPreset(key);
    if (key !== 'custom') setRange(presetRange(key));
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (range.from) qs.set('from', range.from);
      if (range.to) qs.set('to', range.to);
      const res = await fetch(`/api/proxy/admin/reports/orders-csv?${qs}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${range.from || 'all'}-${range.to || 'today'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('CSV downloaded', 'success');
    } catch (err) {
      toast(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  }

  const byDay = sales?.byDay || [];
  const maxRevenue = Math.max(...byDay.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          ['7d', 'Last 7 days'],
          ['30d', 'Last 30 days'],
          ['month', 'This month'],
          ['custom', 'Custom'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              preset === key
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-line bg-white text-ink-soft hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            {label}
          </button>
        ))}
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          From
          <input
            type="date"
            className="input w-auto !py-2"
            value={range.from}
            onChange={(e) => {
              setPreset('custom');
              setRange((r) => ({ ...r, from: e.target.value }));
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          To
          <input
            type="date"
            className="input w-auto !py-2"
            value={range.to}
            onChange={(e) => {
              setPreset('custom');
              setRange((r) => ({ ...r, to: e.target.value }));
            }}
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting}
          className="btn-outline ml-auto"
        >
          <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {!sales && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/70" />
          ))}
        </div>
      )}

      {sales && (
        <>
          <p className="text-xs text-ink-mute">
            {formatDate(sales.range.from)} — {formatDate(sales.range.to)}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={IndianRupee} label="Revenue" value={formatPKR(sales.summary.revenue)} />
            <StatCard icon={ShoppingBag} label="Orders" value={sales.summary.orders} />
            <StatCard icon={ReceiptText} label="AOV" value={formatPKR(sales.summary.aov)} />
            <StatCard icon={Boxes} label="Units sold" value={sales.summary.units} />
          </div>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Revenue by day</h2>
            <div className="mt-4 flex h-40 items-end gap-1.5 overflow-x-auto">
              {byDay.length === 0 && (
                <p className="self-center text-sm text-ink-soft">No orders in this period.</p>
              )}
              {byDay.map((d) => (
                <div
                  key={d.date}
                  className="group flex h-full min-w-6 flex-1 flex-col items-center justify-end gap-1"
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

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-2">
              <h2 className="text-sm font-bold text-ink">Top products</h2>
              {top === null && (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-surface" />
                  ))}
                </div>
              )}
              {top?.length === 0 && (
                <p className="mt-4 text-sm text-ink-soft">No sales in this period.</p>
              )}
              {top?.length > 0 && (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                      <th className="py-2 pr-3 font-semibold">Product</th>
                      <th className="py-2 pr-3 text-right font-semibold">Qty</th>
                      <th className="py-2 text-right font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {top.map((t, i) => (
                      <tr key={t.product || i}>
                        <td className="py-2.5 pr-3">
                          <a
                            href={`/products/${t.slug}`}
                            className="font-medium text-ink hover:text-brand-700"
                          >
                            {t.name}
                          </a>
                        </td>
                        <td className="py-2.5 pr-3 text-right text-ink-soft">{t.qty}</td>
                        <td className="py-2.5 text-right font-semibold text-ink">
                          {formatPKR(t.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card p-5">
              <h2 className="text-sm font-bold text-ink">Orders by status</h2>
              <ul className="mt-4 space-y-2.5">
                {Object.entries(sales.byStatus || {}).map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between gap-3">
                    <span className={`badge border ${STATUS_BADGES[status] || ''}`}>{status}</span>
                    <span className="text-sm font-bold text-ink">{count}</span>
                  </li>
                ))}
                {Object.keys(sales.byStatus || {}).length === 0 && (
                  <li className="text-sm text-ink-soft">No orders in this period.</li>
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
