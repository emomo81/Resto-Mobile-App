import { Response, NextFunction } from 'express';
import User from '../models/User';
import Dish from '../models/Dish';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';
import { AuthRequest } from '../types';

// @desc    Get current user profile
// @route   GET /api/users/me
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).populate('favorites');
  res.status(200).json({ success: true, data: user });
});

// @desc    Update profile
// @route   PATCH /api/users/me
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowedFields = ['fullName', 'phone', 'avatar', 'address', 'pushToken'];
  const updates: any = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user!._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: user });
});

// @desc    Get user favorites
// @route   GET /api/users/me/favorites
export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).populate({
    path: 'favorites',
    populate: { path: 'category', select: 'name slug' },
  });

  res.status(200).json({ success: true, data: user?.favorites || [] });
});

// @desc    Toggle favorite dish
// @route   POST /api/users/me/favorites/:dishId
export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { dishId } = req.params;

  const dish = await Dish.findById(dishId);
  if (!dish) {
    return next(new ErrorResponse('Dish not found', 404));
  }

  const user = req.user!;
  const index = user.favorites.findIndex((id) => id.toString() === dishId);

  if (index > -1) {
    user.favorites.splice(index, 1);
  } else {
    user.favorites.push(dish._id);
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    isFavorite: index === -1,
    data: user.favorites,
  });
});
