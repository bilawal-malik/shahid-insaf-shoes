'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Gallery({ images = [], alt }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [null];
  const current = list[index];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt || alt}
            fill
            priority
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-mute">
            No image
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {list.map((img, i) => (
            <button
              key={img?._id || i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-surface transition-colors ${
                i === index ? 'border-brand-700' : 'border-transparent hover:border-brand-300'
              }`}
            >
              {img && (
                <Image
                  src={img.url}
                  alt={img.alt || `${alt} - ${i + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
