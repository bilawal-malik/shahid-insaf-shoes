import { getPublicConfig } from '../services/configService.js';
import { asyncHandler } from '../utils/apiError.js';

export const publicConfig = asyncHandler(async (_req, res) => {
  res.json(await getPublicConfig());
});
