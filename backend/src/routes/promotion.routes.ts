import { Router } from 'express';
import { getActivePromotions } from '../controllers/promotion.controller';

const router = Router();

router.get('/active', getActivePromotions);

export default router;
