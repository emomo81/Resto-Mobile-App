import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import Dish from '../models/Dish';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';
import { PAGINATION } from '../config/constants';

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort('displayOrder');
  res.status(200).json({ success: true, data: categories });
});

// @desc    Get all dishes with filters
// @route   GET /api/dishes
export const getDishes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const filter: any = { isAvailable: true };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.tag) filter.tags = req.query.tag;
  if (req.query.featured === 'true') filter.isFeatured = true;

  if (req.query.search) {
    filter.$text = { $search: req.query.search as string };
  }

  const [dishes, total] = await Promise.all([
    Dish.find(filter).populate('category', 'name slug').sort('-createdAt').skip(skip).limit(limit),
    Dish.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: dishes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get featured dishes
// @route   GET /api/dishes/featured
export const getFeaturedDishes = asyncHandler(async (_req: Request, res: Response) => {
  const dishes = await Dish.find({ isFeatured: true, isAvailable: true })
    .populate('category', 'name slug')
    .limit(10);
  res.status(200).json({ success: true, data: dishes });
});

// @desc    Get single dish
// @route   GET /api/dishes/:id
export const getDish = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const dish = await Dish.findById(req.params.id).populate('category', 'name slug');

  if (!dish) {
    return next(new ErrorResponse('Dish not found', 404));
  }

  res.status(200).json({ success: true, data: dish });
});
