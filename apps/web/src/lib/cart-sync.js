import { apiClient } from '@/lib/api';

/** Pushes the localStorage guest cart into the server cart after login (docs/04 §3). */
export async function mergeGuestCart() {
  try {
    const raw = window.localStorage.getItem('sis-cart');
    const items = raw ? JSON.parse(raw)?.state?.items || [] : [];
    for (const item of items) {
      await apiClient('/carts/me/items', {
        method: 'POST',
        body: JSON.stringify({
          product: item.productId,
          variant: item.variantId,
          qty: item.qty,
        }),
      });
    }
  } catch {
    /* merge is best-effort — the local cart remains the source of truth */
  }
}
