import { Router } from 'express';
import { body } from 'express-validator';
import { createReview, getDishReviews } from '../controllers/review.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/',
  protect,
  validate([
    body('dishId').notEmpty().withMessage('Dish ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  ]),
  createReview
);

router.get('/dish/:dishId', getDishReviews);

export default router;
