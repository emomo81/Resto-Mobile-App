import { Router } from 'express';
import { createOrder, getMyOrders, getOrder, cancelOrder } from '../controllers/order.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // All order routes require auth

router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;
