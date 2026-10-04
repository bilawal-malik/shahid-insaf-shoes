const apiUrl = process.env.API_URL || 'http://localhost:4100/api/v1';

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let body = null;
    try {
      body = await res.json();
      message = body?.error?.message || message;
    } catch {
      /* ignore */
    }
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

/** Server-side fetch (Server Components) — talks directly to the API. */
export async function api(path, options = {}) {
  const { next, headers, signal, ...rest } = options;
  const res = await fetch(`${apiUrl}${path}`, {
    ...(next ? { next } : { cache: 'no-store' }),
    signal: signal || AbortSignal.timeout(8000),
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  });
  return handleResponse(res);
}

/**
 * Browser fetch — goes through the Next.js proxy route (/api/proxy/*)
 * so httpOnly auth cookies stay same-origin (no CORS).
 */
export async function apiClient(path, options = {}) {
  const { headers, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`/api/proxy${path}`, {
    cache: 'no-store',
    ...rest,
    body,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
  });
  return handleResponse(res);
}
