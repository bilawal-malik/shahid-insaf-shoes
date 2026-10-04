import env from '../config/env.js';
import User from '../models/User.js';
import * as authService from '../services/authService.js';
import { signToken, authCookieOptions } from '../utils/jwt.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';

export const register = asyncHandler(async (req, res) => {
  const { user, otp } = await authService.registerCustomer(req.body);
  const payload = {
    user,
    requiresVerification: true,
    message: `We emailed a 6-digit verification code to ${user.email}.`,
  };
  if (otp && !env.isProd) payload.dev = { otp };
  res.status(201).json(payload);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body);
  const token = signToken(user);
  res.cookie('sis_jwt', token, authCookieOptions());
  res.json({
    ok: true,
    user: authService.toPublicUser(user),
    message: 'Email verified. You are signed in.',
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const dev = await authService.resendVerification(req.body.email);
  const payload = {
    ok: true,
    message: 'If an unverified account exists for that email, a new code has been sent.',
  };
  if (dev && !env.isProd) payload.dev = { otp: dev.otp };
  res.json(payload);
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

export const forgotPassword = asyncHandler(async (req, res) => {
  const dev = await authService.forgotPassword(req.body.email);
  const payload = {
    ok: true,
    message: 'If an account exists for that email, a reset code has been sent.',
  };
  if (dev && !env.isProd) {
    payload.dev = {
      otp: dev.otp,
      resetUrl: `${env.webOrigin}/reset-password?token=${dev.token}`,
    };
  }
  res.json(payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ ok: true, message: 'Password updated. You can sign in now.' });
});
