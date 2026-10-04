import { asyncHandler, ApiError } from '../utils/apiError.js';
import { getConfig, invalidateConfig } from '../services/configService.js';

export const get = asyncHandler(async (_req, res) => {
  const config = await getConfig();
  res.json({ config });
});

function applySection(doc, section, values) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (key === 'social' && section === 'store') {
      for (const [socialKey, socialValue] of Object.entries(value)) {
        if (socialValue !== undefined) doc.store.social[socialKey] = socialValue;
      }
    } else {
      doc[section][key] = value;
    }
  }
}

export const update = asyncHandler(async (req, res) => {
  const body = req.body;
  const hasSection = ['store', 'shipping', 'checkout', 'announcement'].some((s) => body[s]);
  if (!hasSection) throw ApiError.badRequest('Nothing to update');

  const doc = await getConfig();
  if (body.store) applySection(doc, 'store', body.store);
  if (body.shipping) applySection(doc, 'shipping', body.shipping);
  if (body.checkout) applySection(doc, 'checkout', body.checkout);
  if (body.announcement) applySection(doc, 'announcement', body.announcement);

  await doc.save();
  invalidateConfig();
  res.json({ config: doc });
});
