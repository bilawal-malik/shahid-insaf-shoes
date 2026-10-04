'use client';

import { useEffect, useState } from 'react';
import { Save, Megaphone, Truck, Store, Boxes } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import SettingsTabs from '@/components/admin/SettingsTabs';

function toForm(config) {
  return {
    store: {
      name: config.store?.name || '',
      tagline: config.store?.tagline || '',
      phone: config.store?.phone || '',
      email: config.store?.email || '',
      address: config.store?.address || '',
      whatsapp: config.store?.whatsapp || '',
      social: {
        facebook: config.store?.social?.facebook || '',
        instagram: config.store?.social?.instagram || '',
        tiktok: config.store?.social?.tiktok || '',
      },
    },
    shipping: {
      flatRate: String(config.shipping?.flatRate ?? 0),
      freeAbove: String(config.shipping?.freeAbove ?? 0),
      codEnabled: config.shipping?.codEnabled !== false,
      estimatedDays: config.shipping?.estimatedDays || '3-5',
    },
    checkout: {
      allowGuest: config.checkout?.allowGuest !== false,
      lowStockThreshold: String(config.checkout?.lowStockThreshold ?? 5),
    },
    announcement: {
      enabled: Boolean(config.announcement?.enabled),
      text: config.announcement?.text || '',
    },
  };
}

export default function ConfigSettings() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient('/admin/config')
      .then((r) => setForm(toForm(r.config)))
      .catch((err) => toast(err.message || 'Could not load config', 'error'));
  }, [toast]);

  function setSection(section, key, value) {
    setForm((f) => ({
      ...f,
      [section]: { ...f[section], [key]: value },
    }));
  }

  async function save(e) {
    e.preventDefault();
    const nums = ['flatRate', 'freeAbove'];
    for (const k of nums) {
      if (Number.isNaN(Number(form.shipping[k])) || Number(form.shipping[k]) < 0) {
        toast('Shipping values must be numbers', 'error');
        return;
      }
    }
    if (Number.isNaN(Number(form.checkout.lowStockThreshold))) {
      toast('Low-stock threshold must be a number', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        store: form.store,
        shipping: {
          ...form.shipping,
          flatRate: Number(form.shipping.flatRate),
          freeAbove: Number(form.shipping.freeAbove),
        },
        checkout: {
          ...form.checkout,
          lowStockThreshold: Number(form.checkout.lowStockThreshold),
        },
        announcement: form.announcement,
      };
      await apiClient('/admin/config', { method: 'PUT', body: JSON.stringify(body) });
      toast('Store config saved — storefront updates within a minute', 'success');
    } catch (err) {
      const fields = err.body?.error?.fields;
      toast(fields ? Object.values(fields).join(' · ') : err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="h-96 max-w-3xl rounded-2xl bg-white/70" />;

  return (
    <div className="max-w-3xl space-y-5">
      <SettingsTabs />

      <form onSubmit={save} className="space-y-5" noValidate>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Shared by the storefront header, footer, cart and checkout.
          </p>
          <button type="submit" disabled={saving} className="btn-primary shrink-0">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Store className="h-4 w-4 text-brand-600" /> Store info
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Store name</span>
              <input
                className="input"
                value={form.store.name}
                onChange={(e) => setSection('store', 'name', e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="label">Tagline</span>
              <input
                className="input"
                value={form.store.tagline}
                onChange={(e) => setSection('store', 'tagline', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input
                className="input"
                value={form.store.phone}
                onChange={(e) => setSection('store', 'phone', e.target.value)}
                inputMode="tel"
              />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input
                className="input"
                type="email"
                value={form.store.email}
                onChange={(e) => setSection('store', 'email', e.target.value)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Address</span>
              <input
                className="input"
                value={form.store.address}
                onChange={(e) => setSection('store', 'address', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">WhatsApp</span>
              <input
                className="input"
                value={form.store.whatsapp}
                onChange={(e) => setSection('store', 'whatsapp', e.target.value)}
                inputMode="tel"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="label">Facebook</span>
              <input
                className="input"
                value={form.store.social.facebook}
                onChange={(e) =>
                  setSection('store', 'social', { ...form.store.social, facebook: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="label">Instagram</span>
              <input
                className="input"
                value={form.store.social.instagram}
                onChange={(e) =>
                  setSection('store', 'social', { ...form.store.social, instagram: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="label">TikTok</span>
              <input
                className="input"
                value={form.store.social.tiktok}
                onChange={(e) =>
                  setSection('store', 'social', { ...form.store.social, tiktok: e.target.value })
                }
              />
            </label>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Truck className="h-4 w-4 text-brand-600" /> Shipping
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="label">Flat rate (Rs)</span>
              <input
                className="input"
                type="number"
                min="0"
                value={form.shipping.flatRate}
                onChange={(e) => setSection('shipping', 'flatRate', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Free above (Rs)</span>
              <input
                className="input"
                type="number"
                min="0"
                value={form.shipping.freeAbove}
                onChange={(e) => setSection('shipping', 'freeAbove', e.target.value)}
              />
              <span className="mt-1 block text-xs text-ink-mute">0 = never free</span>
            </label>
            <label className="block">
              <span className="label">Estimated days</span>
              <input
                className="input"
                value={form.shipping.estimatedDays}
                onChange={(e) => setSection('shipping', 'estimatedDays', e.target.value)}
                placeholder="3-5"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-line text-brand-700 focus:ring-brand-500"
              checked={form.shipping.codEnabled}
              onChange={(e) => setSection('shipping', 'codEnabled', e.target.checked)}
            />
            Cash on delivery enabled
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Boxes className="h-4 w-4 text-brand-600" /> Checkout &amp; inventory
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Low-stock threshold</span>
              <input
                className="input"
                type="number"
                min="0"
                value={form.checkout.lowStockThreshold}
                onChange={(e) => setSection('checkout', 'lowStockThreshold', e.target.value)}
              />
              <span className="mt-1 block text-xs text-ink-mute">
                Dashboard warns below this per variant
              </span>
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line text-brand-700 focus:ring-brand-500"
                checked={form.checkout.allowGuest}
                onChange={(e) => setSection('checkout', 'allowGuest', e.target.checked)}
              />
              Allow guest checkout
            </label>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Megaphone className="h-4 w-4 text-brand-600" /> Announcement bar
          </h2>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-line text-brand-700 focus:ring-brand-500"
              checked={form.announcement.enabled}
              onChange={(e) => setSection('announcement', 'enabled', e.target.checked)}
            />
            Show the announcement bar
          </label>
          <label className="block">
            <span className="label">Text</span>
            <input
              className="input"
              value={form.announcement.text}
              onChange={(e) => setSection('announcement', 'text', e.target.value)}
              placeholder="Free delivery over Rs 5,000"
              maxLength={240}
            />
          </label>
        </section>

        <div className="flex justify-end pb-6">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
