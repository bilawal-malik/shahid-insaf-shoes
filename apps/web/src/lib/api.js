const apiUrl = process.env.API_URL || 'http://localhost:4100/api/v1';

const DEFAULT_OPTIONS = {
  cache: 'no-store',
  headers: { 'Content-Type': 'application/json' },
};

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
  const res = await fetch(`${apiUrl}${path}`, {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: { ...DEFAULT_OPTIONS.headers, ...(options.headers || {}) },
    next: options.next || undefined,
  });
  return handleResponse(res);
}

/**
 * Browser fetch — goes through the Next.js proxy route (/api/proxy/*)
 * so httpOnly auth cookies stay same-origin (no CORS).
 */
export async function apiClient(path, options = {}) {
  const res = await fetch(`/api/proxy${path}`, {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: { ...DEFAULT_OPTIONS.headers, ...(options.headers || {}) },
  });
  return handleResponse(res);
}
