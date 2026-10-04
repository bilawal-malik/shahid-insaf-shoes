const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/cart',
          '/checkout',
          '/account',
          '/track-order',
          '/order-confirmation',
          '/search',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
