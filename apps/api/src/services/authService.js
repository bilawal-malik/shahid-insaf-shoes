import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export function toPublicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    addresses: user.addresses || [],
    createdAt: user.createdAt,
  };
}

export async function registerCustomer({ name, email, phone, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, password: hashed, role: 'customer' });
  return toPublicUser(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Account is disabled');

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
