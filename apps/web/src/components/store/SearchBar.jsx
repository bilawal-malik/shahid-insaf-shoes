'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <form onSubmit={submit} role="search" className="relative hidden md:block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chappals, shoes..."
          aria-label="Search products"
          className="w-40 rounded-full border border-transparent bg-surface py-2 pl-9 pr-3.5 text-sm text-ink placeholder:text-ink-mute transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 lg:w-64"
        />
      </form>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Search"
        className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <form
          onSubmit={submit}
          role="search"
          className="absolute right-0 top-full z-40 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-line bg-white p-3 shadow-card-hover md:hidden"
        >
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chappals, shoes..."
            aria-label="Search products"
            className="input"
          />
        </form>
      )}
    </div>
  );
}
