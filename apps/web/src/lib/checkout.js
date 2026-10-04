export const PK_PHONE = /^(?:\+92|0)?3\d{9}$/;

export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .trim()
      .replace(/['\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Kashmir',
  'Gilgit-Baltistan',
];

export function shippingFor(subtotal, shipping) {
  if (!shipping) return { cost: 0, label: '—', free: false };
  if (shipping.freeAbove > 0 && subtotal >= shipping.freeAbove) {
    return { cost: 0, label: 'FREE', free: true };
  }
  const cost = shipping.flatRate || 0;
  return { cost, label: `Rs ${cost.toLocaleString()}`, free: false };
}

export function safeNext(param) {
  if (typeof param === 'string' && param.startsWith('/') && !param.startsWith('//')) return param;
  return '/';
}
