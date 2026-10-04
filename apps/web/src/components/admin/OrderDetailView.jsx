'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Printer,
  Copy,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Clock,
  PackageCheck,
} from 'lucide-react';
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

const TRANSITION_LABELS = {
  confirmed: 'Mark confirmed',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
  returned: 'Mark returned',
};

const DANGEROUS = new Set(['cancelled', 'returned']);

function addressText(a) {
  return [a.line1, a.line2, a.city, a.province, a.postalCode].filter(Boolean).join(', ');
}

export default function OrderDetailView({ orderId }) {
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(() => {
    apiClient(`/admin/orders/${orderId}`)
      .then((r) => {
        setOrder(r.order);
        setNoteText(r.order?.internalNote || '');
        setInternalNote(r.order?.internalNote || '');
      })
      .catch((err) => setError(err.message || 'Could not load order'));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function applyTransition(status) {
    setPending(status);
    try {
      await apiClient(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note: confirm?.note || '' }),
      });
      toast(`Order ${TRANSITION_LABELS[status]?.toLowerCase() || status}`, 'success');
      setConfirm(null);
      load();
    } catch (err) {
      const details = err.body?.error?.details;
      toast(
        details?.allowed
          ? `Not allowed. Next: ${details.allowed.join(', ')}`
          : err.message || 'Update failed',
        'error'
      );
    } finally {
      setPending(null);
    }
  }

  async function saveNote() {
    setSavingNote(true);
    try {
      const r = await apiClient(`/admin/orders/${orderId}/note`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNote: noteText }),
      });
      setInternalNote(r.order?.internalNote || '');
      toast('Internal note saved', 'success');
    } catch (err) {
      toast(err.message || 'Could not save note', 'error');
    } finally {
      setSavingNote(false);
    }
  }

  async function copyAddress(a) {
    try {
      await navigator.clipboard.writeText(`${a.fullName}, ${addressText(a)} · ${a.phone}`);
      toast('Address copied', 'success');
    } catch {
      toast('Could not copy address', 'error');
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
        <Link href="/admin/orders" className="btn-outline inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="h-96 rounded-2xl bg-white/70" />;
  }

  const allowed = order.allowedTransitions || [];
  const addr = order.shippingAddress || {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/admin/orders" className="btn-ghost !px-3" aria-label="Back to orders">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-ink">{order.orderNumber}</h2>
            <span className={`badge border ${STATUS_BADGES[order.status] || ''}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-ink-soft">
            Placed {formatDate(order.createdAt, { withTime: true })}
            {order.estimatedDelivery &&
              ` · estimated delivery ${formatDate(order.estimatedDelivery)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-outline ml-auto !px-3"
          title="Print packing slip"
        >
          <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print slip</span>
        </button>
      </div>

      {allowed.length > 0 && (
        <section className="card p-5 print:hidden">
          <h3 className="text-sm font-bold text-ink">Update status</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {allowed.map((s) => (
              <button
                key={s}
                type="button"
                className={DANGEROUS.has(s) ? 'btn-danger' : 'btn-primary'}
                onClick={() => setConfirm({ status: s, note: '' })}
              >
                {TRANSITION_LABELS[s] || s}
              </button>
            ))}
            <span className="text-xs text-ink-mute">
              Allowed from “{order.status}” — enforced server-side
            </span>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card p-5">
            <h3 className="text-sm font-bold text-ink">Items</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                    <th className="py-2 pr-3 font-semibold">Product</th>
                    <th className="py-2 pr-3 font-semibold">Size / color</th>
                    <th className="py-2 pr-3 text-right font-semibold">Price</th>
                    <th className="py-2 pr-3 text-right font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((item, i) => (
                    <tr key={`${item.sku || item.slug}-${i}`}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={`/admin/products/${item.product}`}
                              className="block truncate font-semibold text-ink hover:text-brand-700"
                            >
                              {item.name}
                            </Link>
                            {item.sku && (
                              <span className="block text-xs text-ink-mute">{item.sku}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-ink-soft">
                        {item.size} · {item.color}
                      </td>
                      <td className="py-3 pr-3 text-right text-ink-soft">
                        {formatPKR(item.price)}
                      </td>
                      <td className="py-3 pr-3 text-right text-ink-soft">{item.qty}</td>
                      <td className="py-3 text-right font-semibold text-ink">
                        {formatPKR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="text-sm font-bold text-ink">Status timeline</h3>
            <ol className="mt-4 space-y-4">
              {(order.statusHistory || []).map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {h.status[0].toUpperCase() + h.status.slice(1)}
                      <span className="ml-2 text-xs font-normal text-ink-mute">
                        {formatDate(h.at, { withTime: true })}
                      </span>
                    </p>
                    {h.note && <p className="text-xs text-ink-soft">{h.note}</p>}
                  </div>
                </li>
              ))}
              {(order.statusHistory || []).length === 0 && (
                <li className="text-sm text-ink-soft">No status changes yet.</li>
              )}
            </ol>
          </section>

          <section className="card p-5 print:hidden">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <StickyNote className="h-4 w-4 text-brand-600" /> Internal note
            </h3>
            <p className="mt-1 text-xs text-ink-mute">
              Only admins can see this — never shown to the customer.
            </p>
            <textarea
              className="input mt-3 min-h-24"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Packing instructions, customer calls…"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="btn-primary"
                disabled={savingNote || noteText === internalNote}
                onClick={saveNote}
              >
                {savingNote ? 'Saving…' : 'Save note'}
              </button>
              {noteText !== internalNote && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setNoteText(internalNote)}
                >
                  Discard
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h3 className="text-sm font-bold text-ink">Customer</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold text-ink">{order.customer?.name}</p>
              <a
                href={`tel:${order.customer?.phone}`}
                className="flex items-center gap-2 text-ink-soft hover:text-brand-700"
              >
                <Phone className="h-4 w-4" /> {order.customer?.phone}
              </a>
              {order.customer?.email && (
                <a
                  href={`mailto:${order.customer.email}`}
                  className="flex items-center gap-2 text-ink-soft hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" /> {order.customer.email}
                </a>
              )}
              <p className="pt-1 text-xs text-ink-mute">
                {order.isGuest ? 'Guest checkout' : 'Registered account'}
                {order.user && (
                  <>
                    {' · '}
                    <Link
                      href={`/admin/customers/${order.user._id || order.user}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      View profile
                    </Link>
                  </>
                )}
              </p>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <MapPin className="h-4 w-4 text-brand-600" /> Shipping address
              </h3>
              <button
                type="button"
                onClick={() => copyAddress(addr)}
                className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 print:hidden"
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-1 text-sm text-ink-soft">
              <p className="font-medium text-ink">{addr.fullName}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}, {addr.province}
                {addr.postalCode ? ` ${addr.postalCode}` : ''}
              </p>
              <p>{addr.phone}</p>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="text-sm font-bold text-ink">Payment</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPKR(order.pricing?.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="font-medium text-ink">
                  {order.pricing?.shippingCost === 0
                    ? 'Free'
                    : formatPKR(order.pricing?.shippingCost)}
                </dd>
              </div>
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Discount</dt>
                  <dd className="font-medium text-red-600">−{formatPKR(order.pricing.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-line pt-2">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-extrabold text-ink">{formatPKR(order.pricing?.total)}</dd>
              </div>
              <div className="flex justify-between gap-3 pt-1">
                <dt className="text-ink-soft">Method</dt>
                <dd className="uppercase text-ink">{order.payment?.method}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Status</dt>
                <dd>
                  <span
                    className={`badge border ${
                      order.payment?.status === 'paid'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.payment?.status}
                  </span>
                </dd>
              </div>
            </dl>
            {order.status === 'delivered' && order.payment?.status === 'paid' && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                <PackageCheck className="h-3.5 w-3.5" /> COD collected on delivery
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`${TRANSITION_LABELS[confirm?.status] || 'Update status'}?`}
        message={`Move ${order.orderNumber} to “${confirm?.status}”. This is enforced by the order lifecycle and cannot be undone.`}
        confirmLabel="Confirm"
        danger={DANGEROUS.has(confirm?.status)}
        busy={pending === confirm?.status}
        onConfirm={() => applyTransition(confirm.status)}
        onCancel={() => setConfirm(null)}
      >
        <label className="mt-4 block">
          <span className="label">Note (optional)</span>
          <input
            className="input"
            value={confirm?.note || ''}
            onChange={(e) => setConfirm((c) => ({ ...c, note: e.target.value }))}
            placeholder="Shown in the customer-facing timeline"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}
