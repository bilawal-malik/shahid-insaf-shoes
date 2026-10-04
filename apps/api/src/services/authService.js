import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import env from '../config/env.js';
import { sendMail } from './mailService.js';
import { passwordResetTemplate, verifyEmailTemplate } from './mailTemplates.js';

const RESET_TTL_MS = 30 * 60 * 1000;
const VERIFY_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESET_FIELDS = '+resetOtpHash +resetTokenHash +resetExpiresAt +resetAttempts';
const VERIFY_FIELDS = '+verifyOtpHash +verifyExpiresAt +verifyAttempts';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export function toPublicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    emailVerified: user.emailVerified !== false,
    addresses: user.addresses || [],
    createdAt: user.createdAt,
  };
}

export async function registerCustomer({ name, email, phone, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    phone,
    password: hashed,
    role: 'customer',
    emailVerified: false,
  });

  const otp = String(crypto.randomInt(100000, 1000000));
  user.verifyOtpHash = sha256(otp);
  user.verifyExpiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  user.verifyAttempts = 0;
  await user.save();

  await sendMail({
    to: user.email,
    ...verifyEmailTemplate({ name: user.name, otp }),
    meta: { kind: 'verify' },
  });

  return { user: toPublicUser(user), otp };
}

export async function verifyEmail({ email, otp }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(VERIFY_FIELDS);
  if (!user) throw ApiError.badRequest('Verification code is invalid or has expired');
  if (user.emailVerified) return user;

  if (!user.verifyOtpHash || !user.verifyExpiresAt || user.verifyExpiresAt < new Date()) {
    throw ApiError.badRequest('Verification code has expired. Request a new one.');
  }
  if (user.verifyAttempts >= MAX_OTP_ATTEMPTS) {
    throw ApiError.conflict('Too many wrong attempts. Request a new code.', 'VERIFY_LOCKED');
  }
  if (sha256(otp) !== user.verifyOtpHash) {
    user.verifyAttempts += 1;
    await user.save();
    throw ApiError.badRequest('Wrong verification code');
  }

  user.emailVerified = true;
  user.verifyOtpHash = undefined;
  user.verifyExpiresAt = undefined;
  user.verifyAttempts = 0;
  await user.save();
  return user;
}

export async function resendVerification(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive || user.emailVerified) return null;

  const otp = String(crypto.randomInt(100000, 1000000));
  user.verifyOtpHash = sha256(otp);
  user.verifyExpiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  user.verifyAttempts = 0;
  await user.save();

  await sendMail({
    to: user.email,
    ...verifyEmailTemplate({ name: user.name, otp }),
    meta: { kind: 'verify' },
  });

  return { otp };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Account is disabled');
  if (user.emailVerified === false) {
    throw ApiError.forbidden(
      'Your email is not verified yet. Check your inbox for the verification code.',
      'EMAIL_NOT_VERIFIED'
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  return toPublicUser(user);
}

export async function updateProfile(userId, { name, phone, email, addresses }) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (taken) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
    user.email = email.toLowerCase();
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  if (addresses !== undefined) {
    const clean = addresses.map((a) => ({
      ...(a._id ? { _id: a._id } : {}),
      label: a.label || 'Home',
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || '',
      city: a.city,
      province: a.province,
      postalCode: a.postalCode || '',
      isDefault: !!a.isDefault,
    }));
    if (clean.length === 1) clean[0].isDefault = true;
    if (!clean.some((a) => a.isDefault) && clean.length > 0) clean[0].isDefault = true;
    if (clean.filter((a) => a.isDefault).length > 1) {
      let seen = false;
      for (const a of clean) {
        if (a.isDefault) {
          if (seen) a.isDefault = false;
          seen = true;
        }
      }
    }
    user.addresses = clean;
  }

  await user.save();
  return toPublicUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('Account not found');

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok)
    throw ApiError.badRequest('Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return true;
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) return null;

  const otp = String(crypto.randomInt(100000, 1000000));
  const token = crypto.randomBytes(24).toString('hex');
  user.resetOtpHash = sha256(otp);
  user.resetTokenHash = sha256(token);
  user.resetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  user.resetAttempts = 0;
  await user.save();

  // Delivery: real SMTP in prod; dev shows the code in the UI (controller
  // only includes `dev.otp` when NODE_ENV !== 'production').
  await sendMail({
    to: user.email,
    ...passwordResetTemplate({
      name: user.name,
      otp,
      resetUrl: `${env.webOrigin}/reset-password?token=${token}`,
    }),
    meta: { kind: 'reset' },
  });

  return { otp, token };
}

export async function resetPassword({ token, email, otp, newPassword }) {
  let user;
  if (token) {
    user = await User.findOne({ resetTokenHash: sha256(token) }).select(RESET_FIELDS);
    if (!user) throw ApiError.badRequest('Reset link is invalid or has expired', 'RESET_INVALID');
  } else {
    user = await User.findOne({ email: email.toLowerCase() }).select(RESET_FIELDS);
    if (!user) throw ApiError.badRequest('Reset code is invalid or has expired', 'RESET_INVALID');

    if (!user.resetOtpHash || !user.resetExpiresAt || user.resetExpiresAt < new Date()) {
      throw ApiError.badRequest('Reset code has expired. Request a new one.', 'RESET_EXPIRED');
    }
    if (user.resetAttempts >= MAX_OTP_ATTEMPTS) {
      throw ApiError.conflict('Too many wrong attempts. Request a new code.', 'RESET_LOCKED');
    }
    if (sha256(otp) !== user.resetOtpHash) {
      user.resetAttempts += 1;
      await user.save();
      throw ApiError.badRequest('Wrong reset code', 'OTP_INVALID');
    }
  }

  if (!user.resetExpiresAt || user.resetExpiresAt < new Date()) {
    throw ApiError.badRequest('Reset link has expired. Request a new one.', 'RESET_EXPIRED');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetOtpHash = undefined;
  user.resetTokenHash = undefined;
  user.resetExpiresAt = undefined;
  user.resetAttempts = 0;
  await user.save();
  return user.email;
}
