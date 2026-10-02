import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/cartController.js';
import { validate } from '../utils/validate.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const addSchema = z.object({
  product: z.string().regex(OBJECT_ID, 'Invalid product'),
  variant: z.string().regex(OBJECT_ID, 'Invalid variant'),
  qty: z.number().int().min(1).max(20),
});

const updateSchema = z.object({
  qty: z.number().int().min(0).max(20),
});

router.use(requireAuth);

router.get('/me', ctrl.get);
router.post('/me/items', validate(addSchema), ctrl.addItem);
router.patch('/me/items/:variant', validate(updateSchema), ctrl.updateItem);
router.delete('/me/items/:variant', ctrl.removeItem);
router.delete('/me', ctrl.clear);

export default router;
