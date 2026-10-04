'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterContent from './FilterContent';

export default function MobileFilters({ categories = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline !py-2 text-xs lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[88vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <span className="text-sm font-semibold text-ink">Filters</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterContent categories={categories} />
            </div>
            <div className="border-t border-line p-4">
              <button type="button" onClick={() => setOpen(false)} className="btn-primary w-full">
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
