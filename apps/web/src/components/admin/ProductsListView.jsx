'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Archive, ArchiveRestore, PackageSearch } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPKR } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  archived: 'bg-red-50 text-red-600 border-red-200',
};

export default function ProductsListView() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ page: 1, items: null, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    apiClient('/admin/categories')
      .then((r) => setCategories(r.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q.trim()) params.set('q', q.trim());
    if (status !== 'all') params.set('status', status);
    if (category) params.set('category', category);

    const timer = setTimeout(() => {
      apiClient(`/admin/products?${params}`)
        .then((r) => {
          if (alive) setState({ page: r.page, items: r.items, pages: r.pages, total: r.total });
        })
        .catch((err) => {
          if (alive) {
            setState((s) => ({ ...s, items: [] }));
            toast(err.message || 'Could not load products', 'error');
          }
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, status, category, page, toast]);

  async function quick(p, body) {
    setBusyId(p._id);
    try {
      await apiClient(`/admin/products/${p._id}/quick`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const archived = body.status === 'archived';
      setState((s) => ({
        ...s,
        items: s.items.map((x) =>
          x._id === p._id
            ? {
                ...x,
                ...body,
                status: body.status || x.status,
              }
            : x
        ),
      }));
      toast(
        archived
          ? `“${p.name}” archived`
          : body.status === 'active'
            ? `“${p.name}” is now active`
            : 'Updated',
        'success'
      );
    } catch (err) {
      toast(err.message || 'Update failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const items = state.items;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            className="input pl-9"
            placeholder="Search name, slug or SKU…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          className="input w-auto"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <Link href="/admin/products/new" className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> New product
        </Link>
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
          <PackageSearch className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-3 text-lg font-bold text-ink">No products found</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {q || status !== 'all' || category
              ? 'Try adjusting your search or filters.'
              : 'Create your first product to get started.'}
          </p>
          <Link href="/admin/products/new" className="btn-primary mt-5 inline-flex">
            <Plus className="h-4 w-4" /> New product
          </Link>
        </div>
      )}

      {items?.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p._id} className="transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3">
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {p.primaryImage?.url && (
                          <Image
                            src={p.primaryImage.url}
                            alt={p.primaryImage.alt || p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{p.name}</span>
                        <span className="block truncate text-xs text-ink-mute">/{p.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">
                    {formatPKR(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold ${p.totalStock === 0 ? 'text-red-600' : p.totalStock <= 5 ? 'text-amber-600' : 'text-ink'}`}
                    >
                      {p.totalStock}
                    </span>
                    <span className="text-xs text-ink-mute"> ({p.variantCount})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex gap-1.5">
                      {p.isFeatured && (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                          FEATURED
                        </span>
                      )}
                      {p.isNewArrival && (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                          NEW
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/admin/products/${p._id}`}
                        title="Edit"
                        className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {p.status === 'archived' ? (
                        <button
                          type="button"
                          title="Restore to draft"
                          disabled={busyId === p._id}
                          onClick={async () => {
                            setBusyId(p._id);
                            try {
                              await apiClient(`/admin/products/${p._id}/restore`, {
                                method: 'POST',
                              });
                              setState((s) => ({
                                ...s,
                                items: s.items.map((x) =>
                                  x._id === p._id ? { ...x, status: 'draft' } : x
                                ),
                              }));
                              toast(`“${p.name}” restored as draft`, 'success');
                            } catch (err) {
                              toast(err.message || 'Restore failed', 'error');
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Archive"
                          disabled={busyId === p._id}
                          onClick={() => quick(p, { status: 'archived' })}
                          className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
            Page {state.page} of {state.pages} · {state.total} products
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
