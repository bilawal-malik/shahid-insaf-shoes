import { Router } from 'express';
import { publicConfig } from '../controllers/configController.js';
import { list as searchProducts } from '../controllers/productController.js';

const router = Router();

router.get('/config', publicConfig);
router.get('/search', searchProducts);

export default router;
