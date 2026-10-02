import { Router } from 'express';
import * as ctrl from '../controllers/categoryController.js';

const router = Router();

router.get('/', ctrl.tree);
router.get('/:slug', ctrl.bySlug);

export default router;
