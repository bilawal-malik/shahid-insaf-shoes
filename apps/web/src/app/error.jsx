'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function Error({ error, reset }) {
  return (
    <main className="container-app flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold text-red-600">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">We hit a snag</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        An unexpected error occurred while loading this page. Try again — if it keeps happening,
        contact us and we will sort it out.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="btn-outline">
          Go home
        </Link>
      </div>
      {process.env.NODE_ENV !== 'production' && error?.message && (
        <pre className="mt-6 max-w-full overflow-x-auto rounded-lg bg-surface px-4 py-3 text-left text-xs text-ink-soft">
          {error.message}
        </pre>
      )}
    </main>
  );
}
