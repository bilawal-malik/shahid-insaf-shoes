'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  MapPin,
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Star,
  KeyRound,
  ChevronLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR } from '@/lib/format';
import { PK_PHONE, PROVINCES } from '@/lib/checkout';
import StatusTracker from '@/components/store/StatusTracker';

const SECTIONS = [
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'profile', label: 'Profile', icon: UserCog },
];

const STATUS_STYLES = {
  placed: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-amber-50 text-amber-700 border-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  returned: 'bg-gray-100 text-gray-600 border-gray-200',
};

const EMPTY_ADDRESS = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  postalCode: '',
};

export default function AccountView() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [section, setSection] = useState('orders');

  useEffect(() => {
    let alive = true;
    apiClient('/auth/me')
      .then((r) => {
        if (alive) setUser(r.user);
      })
      .catch((err) => {
        if (!alive) return;
        if (err.status === 401) router.replace('/login?next=/account');
        else setLoadError('Could not load your account. Please refresh.');
      });
    return () => {
      alive = false;
    };
  }, [router]);

  if (loadError) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-sm text-red-600">{loadError}</p>
        <Link href="/" className="btn-outline mt-4 inline-flex">
          Back home
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-app py-10">
        <div className="h-8 w-48 rounded-lg bg-brand-100/60" />
        <div className="mt-6 h-96 rounded-2xl bg-brand-100/60" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 lg:py-10">
      <div className="mb-6">
        <p className="kicker">My account</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
          Hello, {user.name?.split(' ')[0]}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                section === s.key
                  ? 'bg-brand-800 text-white shadow-navy'
                  : 'bg-white text-ink-soft hover:bg-brand-50 hover:text-brand-800'
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
              router.push('/');
              router.refresh();
            }}
            className="hidden shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 lg:flex"
          >
            Sign out
          </button>
        </nav>

        <div className="min-w-0">
          {section === 'orders' && <OrdersSection />}
          {section === 'addresses' && (
            <AddressesSection user={user} onUpdated={(u) => setUser(u)} />
          )}
          {section === 'profile' && <ProfileSection user={user} onUpdated={(u) => setUser(u)} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Orders --------------------------------- */

function OrdersSection() {
  const [state, setState] = useState({ page: 1, items: null, pages: 1, error: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    apiClient(`/orders/me?page=${page}`)
      .then((r) => {
        if (alive) setState({ page, items: r.items, pages: r.pages, error: '' });
      })
      .catch((err) => {
        if (alive)
          setState({ page, items: null, pages: 1, error: err.message || 'Could not load orders' });
      });
    return () => {
      alive = false;
    };
  }, [page]);

  const orders = state.page === page ? state.items : null;
  const pages = state.page === page ? state.pages : 1;
  const error = state.page === page ? state.error : '';

  async function openDetail(id) {
    setSelected(id);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const r = await apiClient(`/orders/me/${id}`);
      setDetail(r.order);
    } catch (err) {
      setDetailError(err.message || 'Could not load order details');
    } finally {
      setDetailLoading(false);
    }
  }

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setDetail(null);
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <ChevronLeft className="h-4 w-4" /> All orders
        </button>

        {detailLoading && <div className="h-64 rounded-2xl bg-brand-100/60" />}

        {detailError && !detailLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {detailError}
          </div>
        )}

        {detail && (
          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-base font-bold text-ink">{detail.orderNumber}</p>
                <p className="text-xs text-ink-soft">
                  Placed{' '}
                  {new Date(detail.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                </p>
              </div>
              <span className={`badge ${STATUS_STYLES[detail.status] || ''}`}>{detail.status}</span>
            </div>

            <div className="mt-5">
              <StatusTracker
                status={detail.status}
                history={detail.statusHistory}
                estimatedDelivery={detail.estimatedDelivery}
              />
            </div>

            <ul className="mt-6 space-y-3 border-t border-line pt-4">
              {detail.items?.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium text-ink">{item.name}</span>
                    <span className="text-xs text-ink-soft">
                      Size {item.size} · {item.color} · ×{item.qty}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatPKR(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatPKR(detail.pricing.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className={detail.pricing.shippingCost === 0 ? 'text-emerald-600' : ''}>
                  {detail.pricing.shippingCost === 0
                    ? 'FREE'
                    : formatPKR(detail.pricing.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold text-ink">Total (COD)</dt>
                <dd className="font-extrabold text-ink">{formatPKR(detail.pricing.total)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!orders && !error && <div className="h-64 rounded-2xl bg-brand-100/60" />}

      {orders && orders.length === 0 && (
        <div className="card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-3 text-lg font-bold text-ink">No orders yet</h2>
          <p className="mt-1 text-sm text-ink-soft">When you place an order it will show up here.</p>
          <Link href="/products" className="btn-primary mt-5 inline-flex">
            Start shopping
          </Link>
        </div>
      )}

      {orders?.length > 0 && (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o._id}>
              <button
                type="button"
                onClick={() => openDetail(o._id)}
                className="card flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-shadow hover:shadow-card-hover"
              >
                <span>
                  <span className="block text-sm font-bold text-ink">{o.orderNumber}</span>
                  <span className="text-xs text-ink-soft">
                    {new Date(o.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })} ·{' '}
                    {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`badge ${STATUS_STYLES[o.status] || ''}`}>{o.status}</span>
                  <span className="text-sm font-extrabold text-ink">
                    {formatPKR(o.pricing.total)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline !px-4 !py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-2 text-sm text-ink-soft">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
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

/* -------------------------------- Addresses -------------------------------- */

function AddressesSection({ user, onUpdated }) {
  const addresses = user.addresses || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function startAdd() {
    setForm({ ...EMPTY_ADDRESS, fullName: user.name || '', phone: user.phone || '' });
    setErrors({});
    setError('');
    setEditing('new');
  }

  function startEdit(a) {
    setForm({
      label: a.label || 'Home',
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || '',
      city: a.city,
      province: a.province,
      postalCode: a.postalCode || '',
    });
    setErrors({});
    setError('');
    setEditing(a._id);
  }

  function validate() {
    const errs = {};
    if (form.fullName.trim().length < 2) errs.fullName = 'Name is required';
    if (!PK_PHONE.test(form.phone.trim())) errs.phone = 'Enter a valid mobile number';
    if (form.line1.trim().length < 3) errs.line1 = 'Address line is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.province) errs.province = 'Select your province';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError('');

    const next =
      editing === 'new'
        ? [...addresses, { ...form }]
        : addresses.map((a) => (a._id === editing ? { ...a, ...form } : a));

    try {
      const r = await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ addresses: next }),
      });
      onUpdated(r.user);
      setEditing(null);
    } catch (err) {
      if (err.body?.error?.fields) setErrors(err.body.error.fields);
      setError(err.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    const next = addresses.filter((a) => a._id !== id);
    try {
      const r = await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ addresses: next }),
      });
      onUpdated(r.user);
    } catch (err) {
      setError(err.message || 'Could not delete address');
    }
  }

  async function makeDefault(id) {
    const next = addresses.map((a) => ({ ...a, isDefault: a._id === id }));
    try {
      const r = await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ addresses: next }),
      });
      onUpdated(r.user);
    } catch (err) {
      setError(err.message || 'Could not update default address');
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {editing ? (
        <form onSubmit={save} className="card space-y-4 p-5 sm:p-6" noValidate>
          <h2 className="text-base font-bold text-ink">
            {editing === 'new' ? 'Add address' : 'Edit address'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Label</span>
              <select className="input" value={form.label} onChange={set('label')}>
                {['Home', 'Work', 'Other'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Full name</span>
              <input className="input" value={form.fullName} onChange={set('fullName')} />
              {errors.fullName && <Err>{errors.fullName}</Err>}
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Mobile number</span>
              <input
                className="input"
                value={form.phone}
                onChange={set('phone')}
                inputMode="tel"
                placeholder="03XXXXXXXXX"
              />
              {errors.phone && <Err>{errors.phone}</Err>}
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Address line</span>
              <input className="input" value={form.line1} onChange={set('line1')} />
              {errors.line1 && <Err>{errors.line1}</Err>}
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Address line 2 (optional)</span>
              <input className="input" value={form.line2} onChange={set('line2')} />
            </label>
            <label className="block">
              <span className="label">City</span>
              <input className="input" value={form.city} onChange={set('city')} />
              {errors.city && <Err>{errors.city}</Err>}
            </label>
            <label className="block">
              <span className="label">Province</span>
              <select className="input" value={form.province} onChange={set('province')}>
                <option value="">Select province</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              {errors.province && <Err>{errors.province}</Err>}
            </label>
            <label className="block">
              <span className="label">Postal code (optional)</span>
              <input
                className="input"
                value={form.postalCode}
                onChange={set('postalCode')}
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save address'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {addresses.length === 0 && (
            <div className="card p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-brand-600" />
              <h2 className="mt-3 text-lg font-bold text-ink">No saved addresses</h2>
              <p className="mt-1 text-sm text-ink-soft">Save an address for faster checkout.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div
                key={a._id}
                className={`card relative p-4 ${a.isDefault ? 'border-brand-700' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink">
                    {a.label || 'Address'}
                    {a.isDefault && (
                      <span className="ml-2 badge bg-brand-50 text-brand-700 border-brand-200">
                        Default
                      </span>
                    )}
                  </p>
                  <div className="flex gap-1">
                    {!a.isDefault && (
                      <IconBtn title="Set as default" onClick={() => makeDefault(a._id)}>
                        <Star className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                    <IconBtn title="Edit" onClick={() => startEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title="Delete" danger onClick={() => remove(a._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {a.fullName} · {a.phone}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.province}
                  {a.postalCode ? ` ${a.postalCode}` : ''}
                </p>
              </div>
            ))}
          </div>

          {addresses.length < 6 && (
            <button type="button" onClick={startAdd} className="btn-outline mt-4 inline-flex">
              <Plus className="h-4 w-4" /> Add address
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------------- Profile --------------------------------- */

function ProfileSection({ user, onUpdated }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone, email: user.email });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    if (!PK_PHONE.test(profile.phone.trim())) {
      setProfileErr('Enter a valid mobile number (03XXXXXXXXX)');
      return;
    }
    setSavingProfile(true);
    try {
      const r = await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      onUpdated(r.user);
      setProfileMsg('Profile updated');
    } catch (err) {
      if (err.body?.error?.fields) {
        setProfileErr(Object.values(err.body.error.fields).join(' · '));
      } else setProfileErr(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (pw.newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters');
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      setPwErr('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await apiClient('/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
        }),
      });
      setPwMsg('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwErr(err.message || 'Could not change password');
    } finally {
      setSavingPw(false);
    }
  }

  const pwSet = (k) => (e) => setPw((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <form onSubmit={saveProfile} className="card space-y-4 p-5 sm:p-6" noValidate>
        <h2 className="text-base font-bold text-ink">Profile details</h2>
        {profileMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {profileMsg}
          </div>
        )}
        {profileErr && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {profileErr}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Full name</span>
            <input
              className="input"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="label">Mobile number</span>
            <input
              className="input"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              inputMode="tel"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
          </label>
        </div>
        <button type="submit" disabled={savingProfile} className="btn-primary">
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4 p-5 sm:p-6" noValidate>
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <KeyRound className="h-4 w-4 text-brand-600" /> Change password
        </h2>
        {pwMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {pwMsg}
          </div>
        )}
        {pwErr && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {pwErr}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Current password</span>
            <input
              className="input"
              type="password"
              value={pw.currentPassword}
              onChange={pwSet('currentPassword')}
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="label">New password</span>
            <input
              className="input"
              type="password"
              value={pw.newPassword}
              onChange={pwSet('newPassword')}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="label">Confirm new</span>
            <input
              className="input"
              type="password"
              value={pw.confirm}
              onChange={pwSet('confirm')}
              autoComplete="new-password"
            />
          </label>
        </div>
        <button type="submit" disabled={savingPw} className="btn-primary">
          {savingPw ? 'Updating…' : 'Change password'}
        </button>
      </form>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => {
            apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
            router.push('/');
            router.refresh();
          }}
          className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function IconBtn({ children, title, danger, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors ${
        danger
          ? 'text-ink-mute hover:bg-red-50 hover:text-red-600'
          : 'text-ink-mute hover:bg-brand-50 hover:text-brand-700'
      }`}
    >
      {children}
    </button>
  );
}

function Err({ children }) {
  return <span className="mt-1 block text-xs text-red-600">{children}</span>;
}
