import { Check, X } from 'lucide-react';

const FLOW = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const LABELS = {
  placed: 'Order Placed',
  confirmed: 'Order Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StatusTracker({ status, history = [], estimatedDelivery }) {
  const stopped = status === 'cancelled' || status === 'returned';
  const currentIndex = FLOW.findIndex((s) => s.key === status);

  return (
    <div>
      {stopped && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <X className="h-4 w-4" /> This order was {LABELS[status]}
        </div>
      )}

      {!stopped && (
        <ol className="flex items-start justify-between">
          {FLOW.map((step, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex;
            return (
              <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={`absolute right-1/2 top-4 h-0.5 w-full ${
                      i <= currentIndex ? 'bg-brand-700' : 'bg-line'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    done
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-line bg-white text-ink-mute'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`mt-2 text-[11px] font-semibold sm:text-xs ${
                    active ? 'text-brand-700' : done ? 'text-ink' : 'text-ink-mute'
                  }`}
                >
                  {step.label}
                </span>
                {active && estimatedDelivery && status !== 'delivered' && (
                  <span className="mt-0.5 hidden text-[10px] text-ink-mute sm:block">
                    by {formatDate(estimatedDelivery).split(',')[0]}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {history.length > 0 && (
        <ul className="mt-6 space-y-3 border-t border-line pt-4">
          {[...history].reverse().map((h, i) => (
            <li key={i} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-medium text-ink">{LABELS[h.status] || h.status}</p>
                {h.note && <p className="mt-0.5 text-xs text-ink-soft">{h.note}</p>}
              </div>
              <span className="shrink-0 text-xs text-ink-mute">{formatDate(h.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
