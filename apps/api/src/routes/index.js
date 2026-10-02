import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './products.routes.js';
import categoryRoutes from './categories.routes.js';
import publicRoutes from './public.routes.js';
import orderRoutes from './orders.routes.js';
import cartRoutes from './carts.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'sis-api', version: 'v1' });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/carts', cartRoutes);
router.use(publicRoutes);

export default router;
