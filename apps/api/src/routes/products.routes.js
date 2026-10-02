import { Router } from 'express';
import * as ctrl from '../controllers/productController.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/featured', ctrl.featured);
router.get('/new-arrivals', ctrl.newArrivals);
router.get('/:slug', ctrl.bySlug);

export default router;
