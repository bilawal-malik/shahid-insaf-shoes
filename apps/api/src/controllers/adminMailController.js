import env from '../config/env.js';
import { getOutbox, isMailConfigured } from '../services/mailService.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';

/**
 * Development-only inspection of outbound mail (see docs/04). Gated by
 * requireAuth+requireAdmin in the router and by NODE_ENV here — the outbox
 * (which can contain reset codes) does not exist in production.
 */
export const outbox = asyncHandler(async (req, res) => {
  if (env.isProd) throw ApiError.notFound('Not available in production');
  res.json({
    items: getOutbox(req.query.limit),
    smtpConfigured: isMailConfigured(),
    notifyEmail: Boolean(env.mail.notify),
  });
});
