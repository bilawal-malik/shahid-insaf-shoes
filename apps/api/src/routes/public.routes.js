import { Router } from 'express';
import { z } from 'zod';
import { publicConfig } from '../controllers/configController.js';
import { list as searchProducts } from '../controllers/productController.js';
import { createMessage } from '../controllers/contactController.js';
import { validate } from '../utils/validate.js';
import { contactLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+92|0)?3\d{9}$/, 'Enter a valid Pakistani mobile number (03XXXXXXXXX)')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(3000),
});

router.get('/config', publicConfig);
router.get('/search', searchProducts);
router.post('/contact', contactLimiter, validate(contactSchema), createMessage);

export default router;
