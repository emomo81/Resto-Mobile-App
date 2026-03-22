import { Router } from 'express';
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  createDish,
  updateDish,
  deleteDish,
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin', 'staff'));

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/dishes', createDish);
router.patch('/dishes/:id', updateDish);
router.delete('/dishes/:id', deleteDish);

export default router;
