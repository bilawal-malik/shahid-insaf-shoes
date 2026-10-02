export function formatPKR(value) {
  const n = Number(value || 0);
  return `Rs ${n.toLocaleString('en-PK')}`;
}

export function formatDate(value, { withTime = false } = {}) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function buildQuery(params, overrides = {}) {
  const qp = new URLSearchParams();
  const merged = { ...params, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    qp.set(key, String(value));
  }
  const s = qp.toString();
  return s ? `?${s}` : '';
}
