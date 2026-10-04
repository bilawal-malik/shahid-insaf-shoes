'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Store } from 'lucide-react';

const TABS = [
  { href: '/admin/settings/config', label: 'Store config', icon: Store },
  { href: '/admin/settings/profile', label: 'My profile', icon: Settings },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
            pathname === t.href
              ? 'border-brand-700 bg-brand-700 text-white'
              : 'border-line bg-white text-ink-soft hover:border-brand-400 hover:text-brand-700'
          }`}
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </Link>
      ))}
    </div>
  );
}
