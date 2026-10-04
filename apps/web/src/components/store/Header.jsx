import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { User, Package } from 'lucide-react';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import CartBadge from './CartBadge';
import SignOutButton from './SignOutButton';

export default async function Header({ config, categories = [] }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('sis_jwt');
  const announcement = config?.announcement;
  const freeAbove = config?.shipping?.freeAbove || 0;
  const announcementText =
    announcement?.enabled && announcement?.text
      ? announcement.text
      : freeAbove > 0
        ? `Free delivery on orders over Rs ${freeAbove.toLocaleString()} · Cash on Delivery nationwide`
        : 'Cash on Delivery nationwide · 3-5 day delivery';

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-950 text-brand-100">
        <div className="container-app flex items-center justify-center gap-2 py-2 text-center text-[11px] font-medium tracking-wide sm:text-xs">
          <span aria-hidden>·</span>
          {announcementText}
          <span aria-hidden>·</span>
        </div>
      </div>

      <div className="border-b border-line bg-white/95 backdrop-blur">
        <div className="container-app relative flex h-16 items-center gap-2 sm:gap-4">
          <MobileMenu categories={categories} isLoggedIn={isLoggedIn} />

          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="SIS home">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
              <Image
                src="/logo.jpeg"
                alt="Shahid Insaf Shoes"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-extrabold tracking-tight text-ink">
                Shahid Insaf Shoes
              </span>
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
                Handcrafted in Pakistan
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="ml-6 hidden items-center gap-6 lg:flex">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/products">All</NavLink>
            {categories.slice(0, 5).map((cat) => (
              <NavLink key={cat._id} href={`/categories/${cat.slug}`}>
                {cat.name}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SearchBar />
            {isLoggedIn ? (
              <>
                <Link
                  href="/account"
                  className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 xl:flex"
                >
                  <User className="h-[18px] w-[18px]" />
                  Account
                </Link>
                <SignOutButton className="hidden rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft xl:block" />
              </>
            ) : (
              <Link
                href="/login"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 xl:flex"
              >
                <User className="h-[18px] w-[18px]" />
                Sign In
              </Link>
            )}
            <Link
              href="/track-order"
              aria-label="Track order"
              className="hidden rounded-lg p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 lg:block"
            >
              <Package className="h-[18px] w-[18px]" />
            </Link>
            <CartBadge />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="relative py-5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-700 after:transition-transform hover:after:scale-x-100"
    >
      {children}
    </Link>
  );
}
