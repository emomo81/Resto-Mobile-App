import { Router } from 'express';
import { getProfile, updateProfile, getFavorites, toggleFavorite } from '../controllers/user.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect); // All user routes require auth

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.get('/me/favorites', getFavorites);
router.post('/me/favorites/:dishId', toggleFavorite);

export default router;
