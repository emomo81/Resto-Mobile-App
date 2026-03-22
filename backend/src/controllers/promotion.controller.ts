import { Request, Response } from 'express';
import Promotion from '../models/Promotion';
import asyncHandler from '../middleware/asyncHandler';

// @desc    Get active promotions
// @route   GET /api/promotions/active
export const getActivePromotions = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();

  const promotions = await Promotion.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })
    .populate('applicableDishes', 'name price images')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: promotions });
});
