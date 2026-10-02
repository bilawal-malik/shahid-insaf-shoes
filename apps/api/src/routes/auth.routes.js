import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/authController.js';
import { validate } from '../utils/validate.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { authLimiter, registerLimiter } from '../middlewares/rateLimit.js';

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

const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    phone: z
      .string()
      .trim()
      .regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)')
      .optional(),
    email: z.string().trim().toLowerCase().email('Enter a valid email').optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

router.post('/register', registerLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, validate(updateMeSchema), ctrl.updateMe);
router.patch('/me/password', requireAuth, validate(passwordSchema), ctrl.changePassword);
router.get('/admin-check', requireAdmin, ctrl.adminCheck);

export default router;
