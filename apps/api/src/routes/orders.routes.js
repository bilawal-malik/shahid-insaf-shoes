import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/orderController.js';
import { validate } from '../utils/validate.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.js';
import { orderLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const PK_PHONE = /^(?:\+92|0)?3\d{9}$/;
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    phone: z.string().trim().regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Enter a valid email')
      .optional()
      .or(z.literal('')),
  }),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)'),
    line1: z.string().trim().min(3, 'Address line is required').max(200),
    line2: z.string().trim().max(200).optional().or(z.literal('')),
    city: z.string().trim().min(2).max(80),
    province: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().max(12).optional().or(z.literal('')),
  }),
  items: z
    .array(
      z.object({
        product: z.string().regex(OBJECT_ID, 'Invalid product'),
        variant: z.string().regex(OBJECT_ID, 'Invalid variant'),
        qty: z.number().int().min(1, 'Quantity must be at least 1').max(20),
      })
    )
    .min(1, 'Cart is empty')
    .max(30),
  createAccount: z
    .object({ password: z.string().min(8, 'Password must be at least 8 characters').max(72) })
    .optional(),
});

const lookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^SIS-\d{4}-\d{5}$/, 'Invalid order number'),
  phone: z.string().trim().regex(PK_PHONE, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)'),
});

router.post('/', optionalAuth, orderLimiter, validate(orderSchema), ctrl.create);
router.get('/lookup', validate(lookupSchema, 'query'), ctrl.lookup);
router.get('/me', requireAuth, ctrl.mine);
router.get('/me/:id', requireAuth, ctrl.detail);

export default router;
