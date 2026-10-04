import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { validate } from '../utils/validate.js';
import * as products from '../controllers/adminProductController.js';
import * as categories from '../controllers/adminCategoryController.js';
import * as uploads from '../controllers/adminUploadController.js';
import * as orders from '../controllers/adminOrderController.js';
import * as customers from '../controllers/adminCustomerController.js';
import * as configCtl from '../controllers/adminConfigController.js';
import * as reports from '../controllers/adminReportController.js';
import * as mail from '../controllers/adminMailController.js';
import { dashboard } from '../controllers/adminDashboardController.js';
import { ORDER_STATUSES } from '../models/Order.js';

const router = Router();

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const imageSchema = z.object({
  url: z.string().trim().min(1).max(500),
  publicId: z.string().trim().max(200).optional().or(z.literal('')),
  alt: z.string().trim().max(200).optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
});

const variantSchema = z.object({
  _id: z.string().regex(OBJECT_ID, 'Invalid variant id').optional(),
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(40),
  sku: z.string().trim().max(64).optional().or(z.literal('')),
  stock: z.number().int().min(0).max(99999),
  priceOverride: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(140),
  slug: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  category: z.string().regex(OBJECT_ID, 'Select a valid category'),
  brand: z.string().trim().max(60).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  price: z.number().int('Price must be a whole number of rupees').min(0, 'Price is required'),
  compareAtPrice: z.number().min(0).nullable().optional(),
  variants: z.array(variantSchema).min(1, 'Add at least one variant').max(100),
  images: z.array(imageSchema).max(12).optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  metaTitle: z.string().trim().max(170).optional().or(z.literal('')),
  metaDescription: z.string().trim().max(320).optional().or(z.literal('')),
});

const quickSchema = z
  .object({
    status: z.enum(['active', 'draft', 'archived']).optional(),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  slug: z.string().trim().max(120).optional().or(z.literal('')),
  parent: z.string().regex(OBJECT_ID).nullable().optional(),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  image: z
    .object({
      url: z.string().trim().max(500).optional().or(z.literal('')),
      alt: z.string().trim().max(200).optional().or(z.literal('')),
      publicId: z.string().trim().max(200).optional().or(z.literal('')),
    })
    .optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().trim().max(170).optional().or(z.literal('')),
  metaDescription: z.string().trim().max(320).optional().or(z.literal('')),
});

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

const noteSchema = z.object({
  internalNote: z.string().trim().max(2000).optional().or(z.literal('')),
});

const customerSchema = z.object({ isActive: z.boolean() });

const socialSchema = z
  .object({
    facebook: z.string().trim().max(300).optional(),
    instagram: z.string().trim().max(300).optional(),
    tiktok: z.string().trim().max(300).optional(),
  })
  .optional();

const configSchema = z
  .object({
    store: z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        tagline: z.string().trim().max(160).optional(),
        phone: z.string().trim().max(30).optional(),
        email: z.string().trim().max(120).optional(),
        address: z.string().trim().max(240).optional(),
        whatsapp: z.string().trim().max(30).optional(),
        social: socialSchema,
      })
      .optional(),
    shipping: z
      .object({
        flatRate: z.number().int().min(0).max(100000).optional(),
        freeAbove: z.number().int().min(0).max(1000000).optional(),
        codEnabled: z.boolean().optional(),
        estimatedDays: z.string().trim().max(20).optional(),
      })
      .optional(),
    checkout: z
      .object({
        allowGuest: z.boolean().optional(),
        lowStockThreshold: z.number().int().min(0).max(1000).optional(),
      })
      .optional(),
    announcement: z
      .object({
        enabled: z.boolean().optional(),
        text: z.string().trim().max(240).optional(),
      })
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard);

router.get('/products', products.list);
router.post('/products', validate(productSchema), products.create);
router.get('/products/:id', products.detail);
router.put('/products/:id', validate(productSchema), products.update);
router.patch('/products/:id/quick', validate(quickSchema), products.quick);
router.delete('/products/:id', products.archive);
router.post('/products/:id/restore', products.restore);

router.post(
  '/upload',
  (req, res, next) => {
    uploads.uploadMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(Object.assign(new Error('File too large (max 5MB)'), { statusCode: 400 }));
      }
      next(err);
    });
  },
  uploads.upload
);
router.delete('/upload/:publicId', uploads.remove);

router.get('/categories', categories.list);
router.post('/categories', validate(categorySchema), categories.create);
router.put('/categories/:id', validate(categorySchema), categories.update);
router.delete('/categories/:id', categories.remove);

router.get('/orders', orders.list);
router.get('/orders/:id', orders.detail);
router.patch('/orders/:id/status', validate(statusSchema), orders.updateStatus);
router.patch('/orders/:id/note', validate(noteSchema), orders.setNote);

router.get('/customers', customers.list);
router.get('/customers/:id', customers.detail);
router.patch('/customers/:id', validate(customerSchema), customers.update);

router.get('/config', configCtl.get);
router.put('/config', validate(configSchema), configCtl.update);

router.get('/reports/sales', reports.sales);
router.get('/reports/top-products', reports.topProducts);
router.get('/reports/orders-csv', reports.ordersCsv);

router.get('/mail/outbox', mail.outbox);

export default router;
