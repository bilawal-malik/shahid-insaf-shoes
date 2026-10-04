'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ban, CircleCheck, Phone, Mail, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const STATUS_BADGES = {
  placed: 'bg-gray-100 text-gray-700 border-gray-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function CustomerDetailView({ customerId }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiClient(`/admin/customers/${customerId}`)
      .then((r) => setData(r))
      .catch((err) => setError(err.message || 'Could not load customer'));
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(isActive) {
    setBusy(true);
    try {
      await apiClient(`/admin/customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast(isActive ? 'Customer reactivated' : 'Customer deactivated', 'success');
      setConfirm(null);
      load();
    } catch (err) {
      toast(err.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
        <Link href="/admin/customers" className="btn-outline inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
      </div>
    );
  }

  if (!data) return <div className="h-96 rounded-2xl bg-white/70" />;

  const { customer, orders } = data;
  const disabled = customer.isActive === false;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/customers" className="btn-ghost !px-3" aria-label="Back to customers">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-ink">{customer.name}</h2>
            <span
              className={`badge border ${
                disabled
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {disabled ? 'disabled' : 'active'}
            </span>
          </div>
          <p className="text-xs text-ink-soft">Joined {formatDate(customer.createdAt)}</p>
        </div>
        <button
          type="button"
          className={disabled ? 'btn-primary ml-auto' : 'btn-danger ml-auto'}
          onClick={() => setConfirm({ next: !disabled })}
        >
          {disabled ? (
            <span className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4" /> Reactivate
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Ban className="h-4 w-4" /> Deactivate
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <section className="card p-5">
            <h3 className="text-sm font-bold text-ink">Contact</h3>
            <div className="mt-3 space-y-2 text-sm text-ink-soft">
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-2 hover:text-brand-700"
              >
                <Phone className="h-4 w-4" /> {customer.phone || '—'}
              </a>
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-2 break-all hover:text-brand-700"
              >
                <Mail className="h-4 w-4" /> {customer.email}
              </a>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
                  Orders
                </dt>
                <dd className="text-lg font-extrabold text-ink">{customer.orderCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
                  Total spent
                </dt>
                <dd className="text-lg font-extrabold text-ink">
                  {formatPKR(customer.totalSpent)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin className="h-4 w-4 text-brand-600" /> Addresses
            </h3>
            {(customer.addresses || []).length === 0 && (
              <p className="mt-3 text-sm text-ink-soft">No saved addresses.</p>
            )}
            <ul className="mt-3 space-y-3">
              {(customer.addresses || []).map((a) => (
                <li key={a._id} className="rounded-xl border border-line p-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    {a.label}
                    {a.isDefault && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                        default
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-ink-soft">{a.fullName}</p>
                  <p className="text-ink-soft">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.province}
                  </p>
                  <p className="text-xs text-ink-mute">{a.phone}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card overflow-x-auto p-0 lg:col-span-2">
          <h3 className="border-b border-line px-5 py-4 text-sm font-bold text-ink">
            Orders ({orders.length})
          </h3>
          {orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Items</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o._id} className="transition-colors hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="font-semibold text-ink hover:text-brand-700"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {formatDate(o.createdAt, { withTime: true })}
                    </td>
                    <td className="px-5 py-3 text-right text-ink-soft">{o.itemCount}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {formatPKR(o.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge border ${STATUS_BADGES[o.status] || ''}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.next ? 'Reactivate customer?' : 'Deactivate customer?'}
        message={
          confirm?.next
            ? `${customer.name} will be able to sign in and place orders again.`
            : `${customer.name} will be signed out and blocked from logging in. Existing orders are untouched.`
        }
        confirmLabel={confirm?.next ? 'Reactivate' : 'Deactivate'}
        danger={!confirm?.next}
        busy={busy}
        onConfirm={() => toggleActive(confirm.next)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
