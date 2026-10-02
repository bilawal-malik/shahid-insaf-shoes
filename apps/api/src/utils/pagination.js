export function getPagination(query, { defaultLimit = 12, maxLimit = 48 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requested));
  return { page, limit, skip: (page - 1) * limit };
}

export function listResponse(items, page, limit, total) {
  return {
    items,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
