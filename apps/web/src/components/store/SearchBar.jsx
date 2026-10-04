'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState(null);
  const [q, setQ] = useState('');

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setShown(false);
  }

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  const openPanel = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const width = Math.min(window.innerWidth - 32, 420);
      const left = Math.min(Math.max(r.right - width, 16), window.innerWidth - width - 16);
      setPos({ top: Math.round(r.bottom + 8), left: Math.round(left), width });
    }
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

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
          enterKeyHint="search"
          autoComplete="off"
          className="w-40 rounded-full border border-transparent bg-surface py-2 pl-9 pr-3.5 text-sm text-ink placeholder:text-ink-mute transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 lg:w-64"
        />
      </form>

      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="Search"
        aria-expanded={open}
        className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 active:scale-95 md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <>
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className={`fixed inset-0 z-40 bg-brand-950/30 transition-opacity duration-150 md:hidden ${
                shown ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <form
              ref={panelRef}
              onSubmit={submit}
              role="search"
              style={pos ? { top: pos.top, left: pos.left, width: pos.width } : undefined}
              className={`fixed z-50 rounded-2xl border border-line bg-white p-3 shadow-card-hover transition-all duration-150 ease-out md:hidden ${
                shown ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0'
              } ${pos ? '' : 'opacity-0'}`}
            >
              <input
                type="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chappals, shoes..."
                aria-label="Search products"
                enterKeyHint="search"
                autoComplete="off"
                className="input"
              />
            </form>
          </>,
          document.body
        )}
    </div>
  );
}
