import Link from 'next/link';

export default function EmptyState({ title, message, actionLabel, actionHref, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {message && <p className="mt-1.5 max-w-md text-sm text-ink-soft">{message}</p>}
      {children}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
