import Image from 'next/image';
import Link from 'next/link';
import { formatPKR } from '@/lib/format';
import { colorHex } from '@/lib/colors';

export default function ProductCard({ product }) {
  const image = product.primaryImage;
  const outOfStock = product.totalStock <= 0;
  const lowStock = !outOfStock && product.totalStock <= 5;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-50/60">
        {image?.url && (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              outOfStock ? 'opacity-60 grayscale' : ''
            }`}
          />
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && (
            <span className="badge bg-red-600 text-white shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="badge bg-brand-800 text-white shadow-sm">New</span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="badge bg-white/95 text-ink shadow-sm">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
          {product.category?.name}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">
          {product.name}
        </h3>

        {product.colors?.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c}
                title={c}
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: colorHex(c) }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[11px] text-ink-mute">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-bold text-ink">{formatPKR(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-ink-mute line-through">
                {formatPKR(product.compareAtPrice)}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] font-medium">
            {outOfStock ? (
              <span className="text-ink-mute">Currently unavailable</span>
            ) : lowStock ? (
              <span className="text-amber-600">Only {product.totalStock} left</span>
            ) : (
              <span className="text-emerald-600">In stock · Cash on Delivery</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
