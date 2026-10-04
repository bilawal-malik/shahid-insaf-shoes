'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone } from 'lucide-react';
import SignOutButton from './SignOutButton';

export default function MobileMenu({ categories = [], isLoggedIn = false }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setShown(false);
  }

  useLayoutEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="-ml-1 rounded-lg p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className={`absolute inset-0 bg-brand-950/40 transition-opacity duration-200 ${
                shown ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
                shown ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between bg-brand-950 px-4 py-4">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white">
                    <Image
                      src="/logo.jpeg"
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-contain"
                    />
                  </span>
                  <span className="text-sm font-bold text-white">Shahid Insaf Shoes</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-brand-100 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <Link
                  href="/"
                  className="block py-2.5 text-sm font-medium text-ink transition-colors hover:text-brand-700"
                >
                  Home
                </Link>
                <Link
                  href="/products"
                  className="block py-2.5 text-sm font-medium text-ink transition-colors hover:text-brand-700"
                >
                  All Products
                </Link>

                <div className="my-3 border-t border-line" />

                {categories.map((cat) => (
                  <div key={cat._id} className="mb-2">
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="block py-2 text-sm font-semibold text-ink"
                    >
                      {cat.name}
                    </Link>
                    {cat.children?.length > 0 && (
                      <div className="ml-3">
                        {cat.children.map((child) => (
                          <Link
                            key={child._id}
                            href={`/categories/${child.slug}`}
                            className="block py-1.5 text-sm text-ink-soft transition-colors hover:text-brand-700"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="my-3 border-t border-line" />

                <Link
                  href="/track-order"
                  className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700"
                >
                  Track Order
                </Link>
                <Link
                  href="/contact"
                  className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700"
                >
                  Contact Us
                </Link>
                <Link
                  href="/faq"
                  className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700"
                >
                  FAQ
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/account"
                      className="block py-2.5 text-sm font-medium text-ink transition-colors hover:text-brand-700"
                      onClick={() => setOpen(false)}
                    >
                      My Account
                    </Link>
                    <SignOutButton className="block w-full py-2.5 text-left text-sm font-medium text-ink-soft" />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700"
                    onClick={() => setOpen(false)}
                  >
                    Sign In / Register
                  </Link>
                )}
              </nav>

              <div className="border-t border-line p-4">
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm font-medium text-brand-700"
                  onClick={() => setOpen(false)}
                >
                  <Phone className="h-4 w-4" /> Need help? Contact us
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
