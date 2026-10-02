'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Guest cart in localStorage (docs/03 §5). Items:
 * { key, productId, slug, name, image, variantId, size, color, price, qty, maxStock }
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(item) {
        const key = `${item.productId}:${item.variantId}`;
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key
                  ? { ...i, qty: Math.min(i.qty + item.qty, item.maxStock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, key, qty: Math.min(item.qty, item.maxStock) }] };
        });
      },

      updateQty(key, qty) {
        set((state) => ({
          items: state.items
            .map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) } : i))
            .filter((i) => i.qty > 0),
        }));
      },

      removeItem(key) {
        set((state) => ({ items: state.items.filter((i) => i.key !== key) }));
      },

      clear() {
        set({ items: [] });
      },

      count() {
        return get().items.reduce((n, i) => n + i.qty, 0);
      },

      subtotal() {
        return get().items.reduce((n, i) => n + i.price * i.qty, 0);
      },
    }),
    { name: 'sis-cart' }
  )
);
