export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .trim()
      .replace(/['\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

/** Ensures slug uniqueness in a collection (suffix -2, -3, ...). */
export async function uniqueSlug(Model, base, excludeId = null) {
  const root = slugify(base);
  let slug = root;
  let n = 1;
  for (;;) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };

    const exists = await Model.exists(query);
    if (!exists) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
