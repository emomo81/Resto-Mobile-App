import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import Dish from '../models/Dish';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';
import { AuthRequest } from '../types';
import { PAGINATION } from '../config/constants';

// @desc    Submit a review
// @route   POST /api/reviews
export const createReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { dishId, rating, comment, images } = req.body;

  const dish = await Dish.findById(dishId);
  if (!dish) {
    return next(new ErrorResponse('Dish not found', 404));
  }

  // Check if user already reviewed this dish
  const existing = await Review.findOne({ user: req.user!._id, dish: dishId });
  if (existing) {
    return next(new ErrorResponse('You have already reviewed this dish', 400));
  }

  const review = await Review.create({
    user: req.user!._id,
    dish: dishId,
    rating,
    comment: comment || '',
    images: images || [],
  });

  const populated = await Review.findById(review._id).populate('user', 'fullName avatar');

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get reviews for a dish
// @route   GET /api/reviews/dish/:dishId
export const getDishReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ dish: req.params.dishId })
      .populate('user', 'fullName avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ dish: req.params.dishId }),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
