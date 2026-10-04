export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function waMeLink(value) {
  let digits = digitsOnly(value);
  if (!digits) return '';
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}
