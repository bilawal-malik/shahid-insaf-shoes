'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderTree, Plus, Pencil, Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { slugify } from '@/lib/checkout';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const EMPTY = {
  name: '',
  slug: '',
  parent: '',
  description: '',
  imageUrl: '',
  imageAlt: '',
  sortOrder: 0,
  isActive: true,
  metaTitle: '',
  metaDescription: '',
};

function buildTree(items) {
  const byParent = new Map();
  for (const item of items) {
    const key = item.parent || 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }
  const rows = [];
  const walk = (parentKey, depth) => {
    const children = (byParent.get(parentKey) || []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    );
    for (const child of children) {
      rows.push({ ...child, depth });
      walk(child._id, depth + 1);
    }
  };
  walk('root', 0);
  return rows;
}

export default function CategoriesView() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const rows = useMemo(() => (items ? buildTree(items) : []), [items]);

  const load = useCallback(() => {
    apiClient('/admin/categories')
      .then((r) => setItems(r.items || []))
      .catch((err) => toast(err.message || 'Could not load categories', 'error'));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched && editing === 'new') next.slug = slugify(value);
      return next;
    });
  };

  function startAdd() {
    setForm({ ...EMPTY, parent: '' });
    setSlugTouched(false);
    setError('');
    setEditing('new');
  }

  function startEdit(cat) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent || '',
      description: cat.description || '',
      imageUrl: cat.image?.url || '',
      imageAlt: cat.image?.alt || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive !== false,
      metaTitle: cat.metaTitle || '',
      metaDescription: cat.metaDescription || '',
    });
    setSlugTouched(true);
    setError('');
    setEditing(cat._id);
  }

  const excludedParents = useMemo(() => {
    if (editing !== 'new' && editing) {
      const self = items?.find((c) => c._id === editing);
      if (!self) return new Set();
      const bad = new Set([self._id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of items || []) {
          if (c.parent && bad.has(c.parent) && !bad.has(c._id)) {
            bad.add(c._id);
            grew = true;
          }
        }
      }
      return bad;
    }
    return new Set();
  }, [editing, items]);

  async function save(e) {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      parent: form.parent || null,
      description: form.description,
      image: { url: form.imageUrl.trim(), alt: form.imageAlt.trim(), publicId: '' },
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
    };
    try {
      if (editing === 'new') {
        await apiClient('/admin/categories', { method: 'POST', body: JSON.stringify(body) });
        toast('Category created', 'success');
      } else {
        await apiClient(`/admin/categories/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast('Category saved', 'success');
      }
      setEditing(null);
      load();
    } catch (err) {
      const be = err.body?.error;
      if (be?.fields) setError(Object.values(be.fields).join(' · '));
      else setError(be?.message || 'Could not save category');
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      await apiClient(`/admin/categories/${confirm._id}`, { method: 'DELETE' });
      toast(`“${confirm.name}” deleted`, 'success');
      setConfirm(null);
      load();
    } catch (err) {
      const be = err.body?.error;
      const msg =
        be?.code === 'HAS_CHILDREN'
          ? 'Move or delete its subcategories first.'
          : be?.code === 'HAS_PRODUCTS'
            ? 'Reassign or archive its products first.'
            : be?.message || 'Could not delete';
      toast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(cat) {
    try {
      await apiClient(`/admin/categories/${cat._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: cat.name,
          slug: cat.slug,
          parent: cat.parent || null,
          description: cat.description || '',
          sortOrder: cat.sortOrder ?? 0,
          isActive: !cat.isActive,
          metaTitle: cat.metaTitle || '',
          metaDescription: cat.metaDescription || '',
          image: cat.image || {},
        }),
      });
      setItems((list) =>
        list.map((c) => (c._id === cat._id ? { ...c, isActive: !c.isActive } : c))
      );
      toast(`“${cat.name}” ${!cat.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      toast(err.message || 'Update failed', 'error');
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{items ? `${items.length} categories` : 'Loading…'}</p>
        <button type="button" onClick={startAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      {!items && <div className="h-64 rounded-2xl bg-white/70" />}

      {items?.length === 0 && (
        <div className="card p-12 text-center">
          <FolderTree className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-3 text-lg font-bold text-ink">No categories yet</h2>
          <button type="button" onClick={startAdd} className="btn-primary mt-5 inline-flex">
            <Plus className="h-4 w-4" /> New category
          </button>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Products</th>
                <th className="px-4 py-3 text-right font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c._id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <span
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${c.depth * 22}px` }}
                    >
                      {c.depth > 0 && <span className="text-ink-mute">└</span>}
                      <span>
                        <span className="font-semibold text-ink">{c.name}</span>
                        <span className="ml-2 text-xs text-ink-mute">/{c.slug}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{c.productCount}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={c.isActive}
                      onClick={() => toggleActive(c)}
                      className={`relative h-6 w-10 rounded-full transition-colors ${c.isActive ? 'bg-brand-700' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          c.isActive ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => startEdit(c)}
                        className="rounded-lg p-2 text-ink-soft hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setConfirm(c)}
                        className="rounded-lg p-2 text-ink-soft hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setEditing(null)}
            className="fixed inset-0 bg-black/40"
          />
          <form
            onSubmit={save}
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">
                {editing === 'new' ? 'New category' : 'Edit category'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-ink-mute hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">Name *</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoFocus
                />
              </label>
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
                <span className="label">Parent</span>
                <select
                  className="input"
                  value={form.parent}
                  onChange={(e) => set('parent', e.target.value)}
                >
                  <option value="">— None (top level) —</option>
                  {(items || [])
                    .filter((c) => !excludedParents.has(c._id))
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Sort order</span>
                <input
                  className="input"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Image URL (optional)</span>
                <input
                  className="input"
                  value={form.imageUrl}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Description</span>
                <textarea
                  className="input min-h-20 resize-y"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Meta title</span>
                <input
                  className="input"
                  value={form.metaTitle}
                  onChange={(e) => set('metaTitle', e.target.value)}
                  maxLength={170}
                />
              </label>
              <label className="flex items-center gap-2.5 self-end pb-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                />
                Active
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete category?"
        message={
          confirm
            ? `“${confirm.name}” will be permanently deleted. This fails if it has subcategories or products.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
