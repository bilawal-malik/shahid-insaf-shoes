import Config from '../models/Config.js';

const TTL_MS = 60_000;
let cache = null;
let cachedAt = 0;

/** Returns the singleton store config, creating defaults on first access. Cached 60s. */
export async function getConfig() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  let doc = await Config.findOne({ key: 'store' });
  if (!doc) doc = await Config.create({ key: 'store' });

  cache = doc;
  cachedAt = Date.now();
  return doc;
}

export function invalidateConfig() {
  cache = null;
  cachedAt = 0;
}

/** Public subset safe to expose on the storefront. */
export async function getPublicConfig() {
  const cfg = await getConfig();
  return {
    store: {
      name: cfg.store.name,
      tagline: cfg.store.tagline,
      phone: cfg.store.phone,
      email: cfg.store.email,
      address: cfg.store.address,
      whatsapp: cfg.store.whatsapp,
      social: cfg.store.social,
    },
    shipping: {
      flatRate: cfg.shipping.flatRate,
      freeAbove: cfg.shipping.freeAbove,
      codEnabled: cfg.shipping.codEnabled,
      estimatedDays: cfg.shipping.estimatedDays,
    },
    checkout: {
      allowGuest: cfg.checkout.allowGuest,
    },
    announcement: cfg.announcement,
  };
}
