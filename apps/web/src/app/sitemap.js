const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
const apiUrl = process.env.API_URL || 'http://localhost:4100/api/v1';

const STATIC_ROUTES = [
  '',
  '/products',
  '/categories',
  '/about',
  '/contact',
  '/faq',
  '/shipping-and-delivery',
  '/returns-and-exchange',
  '/privacy',
  '/terms',
];

async function fetchSlugs(path) {
  try {
    const res = await fetch(`${apiUrl}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));

  const products = await fetchSlugs('/products?limit=1000&fields=slug,updatedAt');
  const categories = await fetchSlugs('/categories?fields=slug,updatedAt');

  return [
    ...staticEntries,
    ...products.map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt || now),
      changeFrequency: 'weekly',
      priority: 0.9,
    })),
    ...categories.map((c) => ({
      url: `${siteUrl}/categories/${c.slug}`,
      lastModified: new Date(c.updatedAt || now),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ];
}
