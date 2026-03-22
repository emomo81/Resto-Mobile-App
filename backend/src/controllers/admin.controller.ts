import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Dish from '../models/Dish';
import User from '../models/User';
import Category from '../models/Category';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';
import { OrderStatus, PAGINATION } from '../config/constants';

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, totalUsers, totalRevenue, popularDishes] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.dish', totalOrdered: { $sum: '$items.quantity' }, name: { $first: '$items.name' } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      todayOrders,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      popularDishes,
    },
  });
});

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'fullName email').sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Update order status
// @route   PATCH /api/admin/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;

  if (!Object.values(OrderStatus).includes(status)) {
    return next(new ErrorResponse('Invalid order status', 400));
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  res.status(200).json({ success: true, data: order });
});

// @desc    Create dish
// @route   POST /api/admin/dishes
export const createDish = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.body.category);
  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  const dish = await Dish.create(req.body);
  res.status(201).json({ success: true, data: dish });
});

// @desc    Update dish
// @route   PATCH /api/admin/dishes/:id
export const updateDish = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!dish) {
    return next(new ErrorResponse('Dish not found', 404));
  }

  res.status(200).json({ success: true, data: dish });
});

// @desc    Delete dish
// @route   DELETE /api/admin/dishes/:id
export const deleteDish = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const dish = await Dish.findByIdAndDelete(req.params.id);

  if (!dish) {
    return next(new ErrorResponse('Dish not found', 404));
  }

  res.status(200).json({ success: true, message: 'Dish deleted' });
});
