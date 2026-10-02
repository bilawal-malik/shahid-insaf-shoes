const apiUrl = process.env.API_URL || 'http://localhost:4100/api/v1';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

const PRIVATE_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/admin',
  '/carts',
  '/orders/me',
];

/**
 * Same-origin proxy to the Express API.
 * - Forwards method/body/query
 * - Forwards the httpOnly auth cookie as a Bearer token
 * - Forwards Set-Cookie from API responses (login/logout)
 * - Keeps browsers off cross-origin calls (zero CORS pain)
 */
export async function proxyRequest(request, params) {
  const { path = [] } = await params;
  const joinedPath = path.join('/');
  const url = new URL(request.url);
  const target = `${apiUrl}/${joinedPath}${url.search}`;

  const headers = new Headers();
  headers.set('Content-Type', request.headers.get('content-type') || 'application/json');

  const cookie = request.headers.get('cookie');
  const jwt = cookie?.match(/(?:^|;\s*)sis_jwt=([^;]+)/)?.[1];
  if (jwt) headers.set('Authorization', `Bearer ${decodeURIComponent(jwt)}`);

  if (PRIVATE_PREFIXES.some((p) => `/${joinedPath}`.startsWith(p))) {
    headers.set('Cache-Control', 'no-store');
  }

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    cache: 'no-store',
    redirect: 'manual',
  });

  const outHeaders = new Headers();
  const passthrough = ['content-type', 'cache-control', 'set-cookie', 'x-request-id'];
  for (const h of passthrough) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  outHeaders.set('Access-Control-Allow-Origin', siteUrl);
  outHeaders.set('Access-Control-Allow-Credentials', 'true');

  const body = res.status === 204 ? null : await res.arrayBuffer();
  return new Response(body, { status: res.status, headers: outHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': siteUrl,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
