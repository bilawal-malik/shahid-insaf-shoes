'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone } from 'lucide-react';

export default function MobileMenu({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-brand-950/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between bg-brand-950 px-4 py-4">
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-brand-800">
                  SIS
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
              <Link href="/" className="block py-2.5 text-sm font-medium text-ink transition-colors hover:text-brand-700">
                Home
              </Link>
              <Link href="/products" className="block py-2.5 text-sm font-medium text-ink transition-colors hover:text-brand-700">
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

              <Link href="/track-order" className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700">
                Track Order
              </Link>
              <Link href="/contact" className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700">
                Contact Us
              </Link>
              <Link href="/faq" className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700">
                FAQ
              </Link>
              <Link href="/login" className="block py-2.5 text-sm text-ink-soft transition-colors hover:text-brand-700">
                Sign In / Register
              </Link>
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
        </div>
      )}
    </>
  );
}
