import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageWindow(page, pages) {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const nums = [];
  for (let i = start; i <= end; i += 1) nums.push(i);
  return nums;
}

export default function Pagination({ page, pages, searchParams = {}, basePath }) {
  if (pages <= 1) return null;

  const href = (p) => {
    const qp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined && v !== null && v !== '' && k !== 'page') qp.set(k, String(v));
    }
    if (p > 1) qp.set('page', String(p));
    const s = qp.toString();
    return `${basePath}${s ? `?${s}` : ''}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-mute/50">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pageWindow(page, pages).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
            p === page
              ? 'bg-brand-700 text-white'
              : 'border border-line text-ink-soft hover:border-brand-400 hover:text-brand-700'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-mute/50">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
