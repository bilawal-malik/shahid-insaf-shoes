import env from '../config/env.js';
import User from '../models/User.js';
import * as authService from '../services/authService.js';
import { signToken, authCookieOptions } from '../utils/jwt.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerCustomer(req.body);
  const token = signToken(user);
  res.cookie('sis_jwt', token, authCookieOptions());
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = signToken(user);
  res.cookie('sis_jwt', token, authCookieOptions());
  res.json({ user, token });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('sis_jwt', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
  });
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.unauthorized('Account not found');
  res.json({ user: authService.toPublicUser(user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.json({ user });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  res.json({ message: 'Password updated' });
});

export const adminCheck = asyncHandler(async (req, res) => {
  res.json({ ok: true, role: req.user.role });
});
