import { Router } from 'express';
import { getCategories, getDishes, getFeaturedDishes, getDish } from '../controllers/menu.controller';

const router = Router();

// Category routes
router.get('/categories', getCategories);

// Dish routes
router.get('/dishes', getDishes);
router.get('/dishes/featured', getFeaturedDishes);
router.get('/dishes/:id', getDish);

export default router;
