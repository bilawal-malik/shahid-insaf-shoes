import { asyncHandler, ApiError } from '../utils/apiError.js';

/**
 * Placeholder auth middleware — replaced in Phase 1 (P1) with real JWT verification.
 * For now it rejects everything protected so routes are "secure by default".
 */
export const requireAuth = asyncHandler(async (_req, _res, _next) => {
  throw ApiError.unauthorized('Auth not implemented yet (Phase 1)');
});

export const requireAdmin = asyncHandler(async (_req, _res, _next) => {
  throw ApiError.forbidden('Admin auth not implemented yet (Phase 1)');
});
