import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-app flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/products" className="btn-outline">
          Browse products
        </Link>
      </div>
    </main>
  );
}
