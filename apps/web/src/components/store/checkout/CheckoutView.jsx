'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useSyncExternalStore, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, MapPin, User as UserIcon, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { formatPKR } from '@/lib/format';
import { PK_PHONE, PROVINCES, shippingFor } from '@/lib/checkout';
import EmptyState from '@/components/ui/EmptyState';

export default function CheckoutView({ config }) {
  const router = useRouter();
  const placedRef = useRef(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const [user, setUser] = useState(null);
  const [savedChoice, setSavedChoice] = useState('new');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    province: '',
    postalCode: '',
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [conflicts, setConflicts] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    apiClient('/auth/me')
      .then((r) => {
        if (!alive) return;
        setUser(r.user);
        setForm((f) => ({
          ...f,
          name: f.name || r.user.name || '',
          phone: f.phone || r.user.phone || '',
          email: f.email || r.user.email || '',
        }));
        const def = r.user.addresses?.find((a) => a.isDefault) || r.user.addresses?.[0] || null;
        if (def) {
          setSavedChoice(def._id);
          setForm((f) => ({
            ...f,
            name: def.fullName || f.name,
            phone: def.phone || f.phone,
            line1: def.line1 || '',
            line2: def.line2 || '',
            city: def.city || '',
            province: def.province || '',
            postalCode: def.postalCode || '',
          }));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const empty = mounted && items.length === 0;
  useEffect(() => {
    // Bounce to the cart when opened empty — but not right after placing an
    // order (clear() empties the cart while we navigate to confirmation).
    if (empty && !placedRef.current) router.replace('/cart');
  }, [empty, router]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const ship = shippingFor(subtotal, config?.shipping);
  const total = subtotal + ship.cost;
  const savedAddress =
    savedChoice !== 'new' ? user?.addresses?.find((a) => a._id === savedChoice) : null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate() {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your name';
    if (!PK_PHONE.test(form.phone.trim())) errs.phone = 'Enter a valid mobile number (03XXXXXXXXX)';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'Enter a valid email';
    if (!savedAddress) {
      if (form.line1.trim().length < 3) errs.line1 = 'Address line is required';
      if (!form.city.trim()) errs.city = 'City is required';
      if (!form.province) errs.province = 'Select your province';
    }
    if (createAccount && !user) {
      if (!form.email.trim()) errs.email = 'Email is required to create an account';
      if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError('');
    setConflicts(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },
        shippingAddress: savedAddress
          ? {
              fullName: savedAddress.fullName,
              phone: savedAddress.phone,
              line1: savedAddress.line1,
              line2: savedAddress.line2 || '',
              city: savedAddress.city,
              province: savedAddress.province,
              postalCode: savedAddress.postalCode || '',
            }
          : {
              fullName: form.name.trim(),
              phone: form.phone.trim(),
              line1: form.line1.trim(),
              line2: form.line2.trim(),
              city: form.city.trim(),
              province: form.province,
              postalCode: form.postalCode.trim(),
            },
        items: items.map((i) => ({ product: i.productId, variant: i.variantId, qty: i.qty })),
        ...(createAccount && !user ? { createAccount: { password } } : {}),
      };

      const res = await apiClient('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      try {
        window.sessionStorage.setItem('sis-last-order', JSON.stringify(res.order));
      } catch {
        /* sessionStorage best-effort */
      }
      placedRef.current = true;
      clear();
      router.push(`/order-confirmation/${res.order.orderNumber}`);
    } catch (err) {
      const body = err.body?.error;
      if (body?.code === 'STOCK_UNAVAILABLE') setConflicts(body.details?.conflicts || []);
      else if (body?.fields) setFieldErrors(body.fields);
      setError(body?.message || 'Could not place your order. Please try again.');
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="container-app py-10">
        <div className="h-8 w-56 rounded-lg bg-brand-100/60" />
        <div className="mt-6 h-96 rounded-2xl bg-brand-100/60" />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="container-app py-12">
        <EmptyState
          title="Your cart is empty"
          message="Add some products before checking out."
          actionLabel="Browse products"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8 lg:py-10">
      <div className="mb-6">
        <p className="kicker">Almost there</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">Checkout</h1>
      </div>

      {conflicts && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Some items just ran out of stock</p>
              <ul className="mt-1.5 space-y-1 text-amber-800">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    {c.name}
                    {c.size ? ` · Size ${c.size}` : ''} — only {c.available} left
                  </li>
                ))}
              </ul>
              <Link
                href="/cart"
                className="mt-2 inline-block font-semibold text-amber-900 underline"
              >
                Review your cart →
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && !conflicts && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={placeOrder} noValidate className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Contact */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <UserIcon className="h-5 w-5 text-brand-600" /> Contact
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Full name</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                />
                {fieldErrors.name && <Err>{fieldErrors.name}</Err>}
              </label>
              <label className="block">
                <span className="label">Mobile number</span>
                <input
                  className="input"
                  value={form.phone}
                  onChange={set('phone')}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="03XXXXXXXXX"
                />
                {fieldErrors.phone && <Err>{fieldErrors.phone}</Err>}
              </label>
              <label className="block sm:col-span-2">
                <span className="label">
                  Email <span className="font-normal text-ink-mute">(optional)</span>
                </span>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
                {fieldErrors.email && <Err>{fieldErrors.email}</Err>}
              </label>
            </div>
          </section>

          {/* Shipping address */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <MapPin className="h-5 w-5 text-brand-600" /> Shipping address
            </h2>

            {user?.addresses?.length > 0 && (
              <div className="mt-4 space-y-2">
                {user.addresses.map((a) => (
                  <label
                    key={a._id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                      savedChoice === a._id
                        ? 'border-brand-700 bg-brand-50'
                        : 'border-line hover:border-brand-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={savedChoice === a._id}
                      onChange={() => setSavedChoice(a._id)}
                      className="mt-1"
                    />
                    <span className="text-sm">
                      <span className="font-semibold text-ink">
                        {a.label || 'Address'} {a.isDefault && '· Default'}
                      </span>
                      <span className="mt-0.5 block text-ink-soft">
                        {a.fullName} · {a.line1}, {a.city}, {a.province}
                      </span>
                    </span>
                  </label>
                ))}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                    savedChoice === 'new'
                      ? 'border-brand-700 bg-brand-50'
                      : 'border-line hover:border-brand-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={savedChoice === 'new'}
                    onChange={() => setSavedChoice('new')}
                    className="mt-1"
                  />
                  <span className="text-sm font-semibold text-ink">Deliver to a new address</span>
                </label>
              </div>
            )}

            {savedChoice === 'new' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="label">Address line</span>
                  <input
                    className="input"
                    value={form.line1}
                    onChange={set('line1')}
                    placeholder="House / street / area"
                    autoComplete="address-line1"
                  />
                  {fieldErrors.line1 && <Err>{fieldErrors.line1}</Err>}
                </label>
                <label className="block sm:col-span-2">
                  <span className="label">
                    Address line 2 <span className="font-normal text-ink-mute">(optional)</span>
                  </span>
                  <input
                    className="input"
                    value={form.line2}
                    onChange={set('line2')}
                    placeholder="Landmark, sector, etc."
                    autoComplete="address-line2"
                  />
                </label>
                <label className="block">
                  <span className="label">City</span>
                  <input
                    className="input"
                    value={form.city}
                    onChange={set('city')}
                    autoComplete="address-level2"
                  />
                  {fieldErrors.city && <Err>{fieldErrors.city}</Err>}
                </label>
                <label className="block">
                  <span className="label">Province</span>
                  <select className="input" value={form.province} onChange={set('province')}>
                    <option value="">Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.province && <Err>{fieldErrors.province}</Err>}
                </label>
                <label className="block">
                  <span className="label">
                    Postal code <span className="font-normal text-ink-mute">(optional)</span>
                  </span>
                  <input
                    className="input"
                    value={form.postalCode}
                    onChange={set('postalCode')}
                    inputMode="numeric"
                  />
                </label>
              </div>
            )}
          </section>

          {/* Delivery */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Truck className="h-5 w-5 text-brand-600" /> Delivery &amp; payment
            </h2>

            <div className="mt-4 rounded-xl border border-brand-700 bg-brand-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="radio" checked readOnly className="mt-1" />
                <span>
                  <span className="flex items-center gap-2 text-sm font-bold text-ink">
                    Cash on Delivery <span className="badge bg-brand-800 text-white">COD</span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    Pay {formatPKR(total)} in cash when your order arrives · Delivery in{' '}
                    {config?.shipping?.estimatedDays || '3-5'} working days
                  </span>
                </span>
              </label>
            </div>

            {!user && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-semibold text-ink">Create an account with this order</span>
                  <span className="mt-0.5 block text-ink-soft">
                    Track orders and check out faster next time.
                  </span>
                  {createAccount && (
                    <span className="mt-3 block">
                      <input
                        type="password"
                        className="input"
                        placeholder="Set a password (8+ characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      {fieldErrors.password && <Err>{fieldErrors.password}</Err>}
                    </span>
                  )}
                </span>
              </label>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink">Order Summary</h2>

            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {i.image && (
                      <Image
                        src={i.image}
                        alt={i.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium text-ink">{i.name}</span>
                    <span className="text-xs text-ink-soft">
                      {i.size} · {i.color} · ×{i.qty}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatPKR(i.price * i.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-medium">{formatPKR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className={`font-medium ${ship.free ? 'text-emerald-600' : ''}`}>
                  {ship.label}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-extrabold text-ink">{formatPKR(total)}</dd>
              </div>
            </dl>

            <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full !py-3.5">
              {submitting ? 'Placing order…' : `Place Order — ${formatPKR(total)}`}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              No payment now — pay on delivery
            </p>
          </div>

          <p className="mt-3 text-center text-xs text-ink-mute">
            By placing an order you agree to our{' '}
            <Link href="/terms" className="underline hover:text-brand-700">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/returns" className="underline hover:text-brand-700">
              Exchange policy
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  );
}

function Err({ children }) {
  return <span className="mt-1 block text-xs text-red-600">{children}</span>;
}
