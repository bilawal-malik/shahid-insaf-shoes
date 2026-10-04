'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, UploadCloud, Star, Wand2, ArrowLeft, Link2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR } from '@/lib/format';
import { slugify } from '@/lib/checkout';
import { useToast } from '@/components/ui/Toast';

function parseSizes(text) {
  const out = [];
  for (const token of String(text)
    .split(/[\s,]+/)
    .filter(Boolean)) {
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      if (hi - lo > 60) return null;
      for (let n = lo; n <= hi; n += 1) out.push(String(n));
    } else {
      out.push(token);
    }
  }
  return out;
}

function skuFor(name, size, color) {
  const base = slugify(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 10);
  const c = color
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 4);
  return `${base || 'SIS'}-${size}-${c || 'X'}`;
}

const emptyVariant = () => ({
  size: '',
  color: '',
  sku: '',
  stock: 0,
  priceOverride: '',
  isActive: true,
});

export default function ProductForm({ productId }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !productId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [bulkSizes, setBulkSizes] = useState('40-44');
  const [bulkColors, setBulkColors] = useState('Black, Tan');
  const [slugTouched, setSlugTouched] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: '',
    brand: 'SIS',
    description: '',
    tags: '',
    price: '',
    compareAtPrice: '',
    status: 'draft',
    isFeatured: false,
    isNewArrival: false,
    metaTitle: '',
    metaDescription: '',
  });
  const [variants, setVariants] = useState([emptyVariant()]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    let alive = true;
    apiClient('/admin/categories')
      .then((r) => {
        if (alive) {
          setCategories(r.items || []);
          setForm((f) => (f.category ? f : { ...f, category: r.items?.[0]?._id || '' }));
        }
      })
      .catch(() => {});

    if (productId) {
      apiClient(`/admin/products/${productId}`)
        .then((r) => {
          if (!alive) return;
          const p = r.product;
          setForm({
            name: p.name,
            slug: p.slug,
            category: p.category?._id || p.category || '',
            brand: p.brand || 'SIS',
            description: p.description || '',
            tags: (p.tags || []).join(', '),
            price: String(p.price ?? ''),
            compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
            status: p.status || 'draft',
            isFeatured: !!p.isFeatured,
            isNewArrival: !!p.isNewArrival,
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
          });
          setSlugTouched(true);
          setVariants(
            (p.variants || []).map((v) => ({
              _id: v._id,
              size: v.size,
              color: v.color,
              sku: v.sku || '',
              stock: v.stock ?? 0,
              priceOverride: v.priceOverride != null ? String(v.priceOverride) : '',
              isActive: v.isActive !== false,
            }))
          );
          setImages(
            (p.images || []).map((img) => ({
              url: img.url,
              publicId: img.publicId || '',
              alt: img.alt || '',
              isPrimary: !!img.isPrimary,
            }))
          );
        })
        .catch((err) => {
          if (alive) setError(err.message || 'Could not load product');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }
    return () => {
      alive = false;
    };
  }, [productId]);

  const set = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched) next.slug = slugify(value);
      return next;
    });
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const setVariant = (idx, key, value) => {
    setVariants((vs) => vs.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  };

  function generateVariants() {
    const sizes = parseSizes(bulkSizes);
    const colors = String(bulkColors)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (!sizes?.length || !colors.length || !sizes) {
      toast('Enter sizes (e.g. 40-44) and colors (e.g. Black, Tan)', 'error');
      return;
    }
    const existing = new Set(variants.map((v) => `${v.size}|${v.color}`.toLowerCase()));
    let added = 0;
    const next = [...variants];
    for (const size of sizes) {
      for (const color of colors) {
        const key = `${size}|${color}`.toLowerCase();
        if (existing.has(key)) continue;
        existing.add(key);
        next.push({
          ...emptyVariant(),
          size,
          color,
          sku: skuFor(form.name || 'SIS', size, color),
        });
        added += 1;
      }
    }
    if (!added) {
      toast('All combinations already exist', 'error');
      return;
    }
    setVariants(next);
    toast(`Added ${added} variant${added === 1 ? '' : 's'}`, 'success');
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, 6);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast(`${file.name} is over 5MB`, 'error');
          continue;
        }
        const fd = new FormData();
        fd.append('file', file);
        const res = await apiClient('/admin/upload?folder=products', { method: 'POST', body: fd });
        setImages((imgs) => [
          ...imgs,
          { url: res.url, publicId: res.publicId, alt: form.name, isPrimary: imgs.length === 0 },
        ]);
      }
      toast('Image uploaded', 'success');
    } catch (err) {
      toast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  function addByUrl() {
    const url = urlDraft.trim();
    if (!/^https?:\/\//.test(url)) {
      toast('Enter a valid image URL', 'error');
      return;
    }
    setImages((imgs) => [
      ...imgs,
      { url, publicId: '', alt: form.name, isPrimary: imgs.length === 0 },
    ]);
    setUrlDraft('');
  }

  function setPrimary(idx) {
    setImages((imgs) => imgs.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  function removeImage(idx) {
    setImages((imgs) => {
      const next = imgs.filter((_, i) => i !== idx);
      if (next.length && !next.some((img) => img.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  }

  const cleanVariants = useMemo(
    () =>
      variants
        .filter((v) => v.size.trim() && v.color.trim())
        .map((v) => ({
          ...(v._id ? { _id: v._id } : {}),
          size: v.size.trim(),
          color: v.color.trim(),
          sku: v.sku.trim(),
          stock: Math.max(0, Number(v.stock) || 0),
          priceOverride:
            v.priceOverride === '' || v.priceOverride == null ? null : Number(v.priceOverride),
          isActive: v.isActive !== false,
        })),
    [variants]
  );

  function validate() {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Name is required';
    if (!form.category) errs.category = 'Pick a category';
    const price = Number(form.price);
    if (form.price === '' || !Number.isInteger(price) || price < 0)
      errs.price = 'Enter a whole-number price in rupees';
    if (form.compareAtPrice !== '' && Number(form.compareAtPrice) < 0)
      errs.compareAtPrice = 'Must be 0 or more';
    if (cleanVariants.length === 0) errs.variants = 'Add at least one variant (size + color)';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save(e) {
    e?.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      brand: form.brand.trim() || 'SIS',
      description: form.description,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
      status: form.status,
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      images: images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        isPrimary: img.isPrimary,
      })),
      variants: cleanVariants,
    };
    try {
      if (isNew) {
        await apiClient('/admin/products', { method: 'POST', body: JSON.stringify(body) });
        toast('Product created', 'success');
      } else {
        await apiClient(`/admin/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Product saved', 'success');
      }
      router.push('/admin/products');
    } catch (err) {
      const bodyErr = err.body?.error;
      if (bodyErr?.fields) setFieldErrors(bodyErr.fields);
      setError(bodyErr?.message || 'Could not save product');
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-96 rounded-2xl bg-white/70" />;
  }

  const priceNum = Number(form.price) || 0;

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/products"
          className="rounded-lg p-2 text-ink-soft hover:bg-white hover:text-ink"
          aria-label="Back to products"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">
            {isNew ? 'New product' : form.name || 'Edit product'}
          </h1>
          {!isNew && <p className="text-xs text-ink-mute">/{form.slug}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/products" className="btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Main */}
          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-bold text-ink">Main info</h2>
            <label className="block">
              <span className="label">Name *</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Peshawari Chappal — Classic"
              />
              {fieldErrors.name && <Err>{fieldErrors.name}</Err>}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Slug</span>
                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                />
              </label>
              <label className="block">
                <span className="label">Category *</span>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && <Err>{fieldErrors.category}</Err>}
              </label>
              <label className="block">
                <span className="label">Price (PKR) *</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
                {fieldErrors.price && <Err>{fieldErrors.price}</Err>}
              </label>
              <label className="block">
                <span className="label">Compare-at price</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  value={form.compareAtPrice}
                  onChange={(e) => set('compareAtPrice', e.target.value)}
                  placeholder="optional"
                />
                {fieldErrors.compareAtPrice && <Err>{fieldErrors.compareAtPrice}</Err>}
              </label>
              <label className="block">
                <span className="label">Brand</span>
                <input
                  className="input"
                  value={form.brand}
                  onChange={(e) => set('brand', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Tags (comma separated)</span>
                <input
                  className="input"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  placeholder="leather, summer"
                />
              </label>
            </div>
            <label className="block">
              <span className="label">Description</span>
              <textarea
                className="input min-h-28 resize-y"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>
          </section>

          {/* Variants */}
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">
                Variants <span className="text-ink-mute">({cleanVariants.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setVariants((vs) => [...vs, emptyVariant()])}
                className="btn-outline !py-1.5 !text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            </div>
            {fieldErrors.variants && (
              <p className="mt-2 text-xs text-red-600">{fieldErrors.variants}</p>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-surface p-3">
              <label className="block flex-1">
                <span className="label !text-ink-soft">Sizes (e.g. 40-44 or 40, 41, 42)</span>
                <input
                  className="input"
                  value={bulkSizes}
                  onChange={(e) => setBulkSizes(e.target.value)}
                />
              </label>
              <label className="block flex-1">
                <span className="label !text-ink-soft">Colors (comma separated)</span>
                <input
                  className="input"
                  value={bulkColors}
                  onChange={(e) => setBulkColors(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={generateVariants}
                className="btn-dark !py-2.5 !text-xs"
              >
                <Wand2 className="h-3.5 w-3.5" /> Generate
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-mute">
                    <th className="pb-2 pr-2 font-semibold">Size</th>
                    <th className="pb-2 pr-2 font-semibold">Color</th>
                    <th className="pb-2 pr-2 font-semibold">SKU</th>
                    <th className="pb-2 pr-2 font-semibold">Stock</th>
                    <th className="pb-2 pr-2 font-semibold">Price override</th>
                    <th className="pb-2 pr-2 font-semibold">Active</th>
                    <th className="pb-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1.5 pr-2">
                        <input
                          className="input !py-1.5"
                          value={v.size}
                          onChange={(e) => setVariant(i, 'size', e.target.value)}
                          placeholder="42"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          className="input !py-1.5"
                          value={v.color}
                          onChange={(e) => setVariant(i, 'color', e.target.value)}
                          placeholder="Tan"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          className="input !py-1.5"
                          value={v.sku}
                          onChange={(e) => setVariant(i, 'sku', e.target.value)}
                          placeholder="optional"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          className="input w-20 !py-1.5"
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => setVariant(i, 'stock', e.target.value)}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          className="input w-24 !py-1.5"
                          type="number"
                          min="0"
                          value={v.priceOverride}
                          onChange={(e) => setVariant(i, 'priceOverride', e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="checkbox"
                          checked={v.isActive}
                          onChange={(e) => setVariant(i, 'isActive', e.target.checked)}
                          className="mt-2"
                        />
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          aria-label="Remove variant"
                          onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                          className="rounded p-1.5 text-ink-mute hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Images */}
          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Images</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="btn-outline cursor-pointer !py-2">
                <UploadCloud className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload files'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    uploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="flex min-w-56 flex-1 items-center gap-2">
                <input
                  className="input"
                  placeholder="…or paste image URL"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addByUrl}
                  className="btn-outline shrink-0 !px-3 !py-2.5"
                >
                  <Link2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {images.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">No images yet.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {images.map((img, i) => (
                  <li
                    key={`${img.url}-${i}`}
                    className={`flex gap-3 rounded-xl border p-3 ${
                      img.isPrimary ? 'border-brand-700 bg-brand-50' : 'border-line'
                    }`}
                  >
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                      <Image
                        src={img.url}
                        alt={img.alt || 'Product image'}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <input
                        className="input !py-1.5 text-xs"
                        value={img.alt}
                        placeholder="Alt text"
                        onChange={(e) =>
                          setImages((imgs) =>
                            imgs.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x))
                          )
                        }
                      />
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPrimary(i)}
                          className={`flex items-center gap-1 text-xs font-semibold ${
                            img.isPrimary ? 'text-brand-700' : 'text-ink-mute hover:text-brand-700'
                          }`}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${img.isPrimary ? 'fill-brand-700 text-brand-700' : ''}`}
                          />
                          {img.isPrimary ? 'Primary' : 'Set primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="flex items-center gap-1 text-xs font-semibold text-ink-mute hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* SEO */}
          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-bold text-ink">SEO</h2>
            <label className="block">
              <span className="label">Meta title</span>
              <input
                className="input"
                value={form.metaTitle}
                onChange={(e) => set('metaTitle', e.target.value)}
                placeholder={form.name || 'Page title'}
                maxLength={170}
              />
            </label>
            <label className="block">
              <span className="label">Meta description</span>
              <textarea
                className="input min-h-20 resize-y"
                value={form.metaDescription}
                onChange={(e) => set('metaDescription', e.target.value)}
                maxLength={320}
              />
            </label>
            {(form.metaTitle || form.metaDescription) && (
              <div className="rounded-xl border border-line p-3">
                <p className="truncate text-sm text-[#1a0dab]">{form.metaTitle || form.name}</p>
                <p className="truncate text-xs text-[#4d5156]">
                  sis.pk › products › {form.slug || '…'}
                </p>
                <p className="line-clamp-2 text-xs text-[#4d5156]">
                  {form.metaDescription || form.description || 'No description'}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-bold text-ink">Publish</h2>
            <label className="block">
              <span className="label">Status</span>
              <select
                className="input"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
              />
              Featured on home
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => set('isNewArrival', e.target.checked)}
              />
              Mark as new arrival
            </label>
            <p className="text-xs text-ink-soft">
              Storefront price:{' '}
              <span className="font-semibold text-ink">{formatPKR(priceNum)}</span>
              {form.compareAtPrice && Number(form.compareAtPrice) > priceNum && (
                <span className="ml-1 line-through text-ink-mute">
                  {formatPKR(Number(form.compareAtPrice))}
                </span>
              )}
            </p>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-sm font-bold text-ink">Tips</h2>
            <ul className="space-y-2 text-xs text-ink-soft">
              <li>
                • Only <strong className="text-ink">Active</strong> products show on the storefront.
              </li>
              <li>• Variants used in past orders can be deactivated but not deleted.</li>
              <li>• Mark one image as primary — it is used in listings and search.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Mobile save bar */}
      <div className="sticky bottom-4 z-10 lg:hidden">
        <button type="submit" disabled={saving} className="btn-primary w-full !py-3.5 shadow-lg">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save product'}
        </button>
      </div>
    </form>
  );
}

function Err({ children }) {
  return <span className="mt-1 block text-xs text-red-600">{children}</span>;
}
