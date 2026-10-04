import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/authController.js';
import { validate } from '../utils/validate.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  authLimiter,
  registerLimiter,
  resetLimiter,
  verifyLimiter,
  resendLimiter,
} from '../middlewares/rateLimit.js';

const router = Router();

const PK_PHONE = /^(?:\+92|0)?3\d{9}$/;

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const addressSchema = z.object({
  _id: z.string().optional(),
  label: z.string().trim().max(30).optional(),
  fullName: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)'),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(1).max(60),
  province: z.string().trim().min(1).max(60),
  postalCode: z.string().trim().max(12).optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
});

const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    phone: z
      .string()
      .trim()
      .regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)')
      .optional(),
    email: z.string().trim().toLowerCase().email('Enter a valid email').optional(),
    addresses: z.array(addressSchema).max(6, 'You can save up to 6 addresses').optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const resetSchema = z
  .object({
    token: z.string().trim().min(10).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code')
      .optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
  })
  .refine((v) => v.token || (v.email && v.otp), {
    message: 'Open your reset link or enter email + code',
  });

router.post('/register', registerLimiter, validate(registerSchema), ctrl.register);
router.post('/verify-email', verifyLimiter, validate(verifySchema), ctrl.verifyEmail);
router.post('/resend-verification', resendLimiter, validate(forgotSchema), ctrl.resendVerification);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, validate(updateMeSchema), ctrl.updateMe);
router.patch('/me/password', requireAuth, validate(passwordSchema), ctrl.changePassword);
router.post('/forgot-password', resetLimiter, validate(forgotSchema), ctrl.forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetSchema), ctrl.resetPassword);
router.get('/admin-check', requireAdmin, ctrl.adminCheck);

export default router;
