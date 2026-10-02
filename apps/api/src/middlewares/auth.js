import { asyncHandler, ApiError } from '../utils/apiError.js';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/** Requires a valid JWT (Authorization: Bearer or forwarded cookie) + active account. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub).select('name email phone role isActive');
  if (!user) throw ApiError.unauthorized('Account not found');
  if (!user.isActive) throw ApiError.forbidden('Account is disabled');

  req.user = user;
  return next();
});

export const requireAdmin = [
  requireAuth,
  (req, _res, next) => {
    if (req.user?.role !== 'admin') return next(ApiError.forbidden('Admin access required'));
    return next();
  },
];

/** Attaches req.user when a valid token is present; never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select('name email phone role isActive');
    if (user?.isActive) req.user = user;
  } catch {
    /* invalid token → proceed as guest */
  }
  return next();
});
