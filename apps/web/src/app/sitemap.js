const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
const apiUrl = process.env.API_URL || 'http://localhost:4100/api/v1';

const STATIC_ROUTES = [
  '',
  '/products',
  '/about',
  '/contact',
  '/faq',
  '/shipping',
  '/returns',
  '/privacy',
  '/terms',
];

async function fetchJson(path) {
  try {
    const res = await fetch(`${apiUrl}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const data = await fetchJson(`/products?limit=48&page=${page}`);
    if (!data?.items?.length) break;
    all.push(...data.items);
    if (page >= (data.pages || 1)) break;
  }
  return all;
}

function flattenCategories(nodes, out = []) {
  for (const node of nodes || []) {
    out.push(node);
    if (node.children?.length) flattenCategories(node.children, out);
  }
  return out;
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));

  const [products, categoriesRes] = await Promise.all([
    fetchAllProducts(),
    fetchJson('/categories'),
  ]);
  const categories = flattenCategories(categoriesRes?.items);

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
