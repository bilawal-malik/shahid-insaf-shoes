'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { formatPKR } from '@/lib/format';
import { colorHex } from '@/lib/colors';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';

export default function BuyBox({ product }) {
  const activeVariants = product.variants.filter((v) => v.isActive !== false);
  const colors = [...new Set(activeVariants.map((v) => v.color))];

  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();

  const colorVariants = activeVariants.filter((v) => v.color === color);
  const variant = activeVariants.find((v) => v.color === color && v.size === size);
  const price = variant?.priceOverride ?? product.price;
  const stock = variant?.stock ?? 0;
  const anyInStock = activeVariants.some((v) => v.stock > 0);
  const soldOut = variant ? stock < 1 : !anyInStock;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > price
      ? Math.round((1 - price / product.compareAtPrice) * 100)
      : 0;

  const selectColor = (c) => {
    setColor(c);
    const hasSize = activeVariants.some((v) => v.color === c && v.size === size && v.stock > 0);
    if (!hasSize) setSize(null);
    setQty(1);
  };

  const addToCart = () => {
    if (!variant) {
      toast('Please select a size first', 'error');
      return;
    }
    if (stock < 1) {
      toast('This size is out of stock', 'error');
      return;
    }
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url || '',
      variantId: variant._id,
      size: variant.size,
      color: variant.color,
      price,
      qty: Math.min(qty, stock),
      maxStock: stock,
    });
    toast('Added to cart');
    setQty(1);
  };

  return (
    <div>
      <p className="text-sm text-ink-mute">{product.category?.name}</p>
      <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
        {product.name}
      </h1>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-bold text-ink">{formatPKR(price)}</span>
        {product.compareAtPrice && product.compareAtPrice > price && (
          <span className="text-base text-ink-mute line-through">
            {formatPKR(product.compareAtPrice)}
          </span>
        )}
        {discountPercent > 0 && (
          <span className="badge bg-red-100 text-red-700">{discountPercent}% OFF</span>
        )}
      </div>

      <p className="mt-2 text-sm text-ink-soft">
        {stock > 0 ? (
          stock <= 5 ? (
            <span className="font-medium text-amber-600">Only {stock} left in stock</span>
          ) : (
            <span className="text-green-700">In stock</span>
          )
        ) : size ? (
          <span className="font-medium text-red-600">Out of stock</span>
        ) : (
          'Select a size to check availability'
        )}
      </p>

      {/* Color */}
      {colors.length > 0 && (
        <div className="mt-6">
          <p className="mb-2.5 text-sm font-semibold text-ink">
            Color: <span className="font-normal text-ink-soft">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectColor(c)}
                aria-pressed={c === color}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  c === color
                    ? 'border-brand-700 bg-brand-50 font-semibold text-brand-800'
                    : 'border-line text-ink-soft hover:border-brand-300'
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: colorHex(c) }}
                />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      <div className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            Size {size && <span className="font-normal text-ink-soft">— {size}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
          {colorVariants.map((v) => {
            const disabled = v.stock < 1;
            const selected = v.size === size;
            return (
              <button
                key={v._id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => {
                  setSize(v.size);
                  setQty(1);
                }}
                className={`relative h-11 min-w-12 rounded-lg border px-3 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : disabled
                      ? 'cursor-not-allowed border-line bg-surface text-ink-mute/50 line-through'
                      : 'border-line text-ink hover:border-brand-400 hover:bg-brand-50'
                }`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {!colorVariants.length && <p className="text-sm text-ink-mute">No sizes available</p>}
      </div>

      {/* Qty + Add to cart */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 w-36 shrink-0 items-center justify-between rounded-lg border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-full w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-ink">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stock || 1, q + 1))}
            disabled={qty >= stock}
            aria-label="Increase quantity"
            className="flex h-full w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          className="btn-primary h-12 flex-1 !text-base"
        >
          <ShoppingBag className="h-5 w-5" />
          {soldOut ? 'Out of stock' : 'Add to Cart'}
        </button>
      </div>

      {/* Trust row */}
      <ul className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
        {[
          { icon: Truck, text: 'Cash on Delivery · 3-5 day delivery' },
          { icon: RotateCcw, text: '7-day exchange on unused items' },
          { icon: ShieldCheck, text: 'Quality guaranteed' },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <Icon className="h-4 w-4 text-brand-700" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
