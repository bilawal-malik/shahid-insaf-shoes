'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

const SETTINGS_NAV = {
  href: '/admin/settings/profile',
  label: 'Settings',
  icon: Settings,
  match: '/admin/settings',
};

function isActive(pathname, item) {
  if (item.href === '/admin') return pathname === '/admin';
  if (item.match) return pathname.startsWith(item.match);
  return pathname.startsWith(item.href);
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const active = [...NAV, SETTINGS_NAV].find((n) => isActive(pathname, n));
  const title = active?.label || 'Admin';

  async function logout() {
    setLoggingOut(true);
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      /* best effort */
    }
    router.push('/');
    router.refresh();
  }

  const navItems = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const activeItem = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeItem
                ? 'bg-brand-800 text-white shadow-navy'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}

      <div className="my-3 border-t border-white/10" />

      <Link
        href={SETTINGS_NAV.href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive(pathname, SETTINGS_NAV)
            ? 'bg-brand-800 text-white shadow-navy'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <SETTINGS_NAV.icon className="h-5 w-5" />
        {SETTINGS_NAV.label}
      </Link>
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Store className="h-5 w-5" />
        View store
      </Link>
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
      >
        <LogOut className="h-5 w-5" />
        {loggingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-brand-950 lg:flex print:hidden">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-black text-white">
            SIS
          </span>
          <div>
            <p className="text-sm font-bold leading-tight text-white">Admin</p>
            <p className="text-xs text-slate-400">Shahid Insaf Shoes</p>
          </div>
        </div>
        {navItems}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-brand-950">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-black text-white">
                SIS
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navItems}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white px-4 lg:px-8 print:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink-soft hover:bg-surface lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-ink">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-semibold text-ink-soft hover:text-brand-700 sm:block"
            >
              View store
            </Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
              A
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
