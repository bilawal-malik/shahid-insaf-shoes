const FILTER_KEYS = ['category', 'size', 'color', 'minPrice', 'maxPrice', 'q', 'sort', 'featured', 'newArrival'];

/** Converts storefront searchParams into an API /products query string. */
export function spToProductQuery(sp, { limit = 12 } = {}) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (sp[key]) params.set(key, String(sp[key]));
  }
  if (sp.page) params.set('page', String(sp.page));
  params.set('limit', String(limit));
  return params.toString();
}
