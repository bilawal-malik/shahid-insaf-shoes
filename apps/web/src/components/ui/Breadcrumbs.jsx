import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  if (!items?.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-mute">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-mute/70" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-brand-700">
                {item.name}
              </Link>
            ) : (
              <span className="text-ink">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
