import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Dish from '../models/Dish';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';
import { AuthRequest } from '../types';
import { OrderStatus, PAGINATION } from '../config/constants';

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { items, orderType, tableNumber, notes } = req.body;

  if (!items || items.length === 0) {
    return next(new ErrorResponse('Order must contain at least one item', 400));
  }

  // Validate dishes exist and calculate totals
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const dish = await Dish.findById(item.dishId);
    if (!dish) {
      return next(new ErrorResponse(`Dish not found: ${item.dishId}`, 404));
    }

    // Calculate size modifier
    let sizeModifier = 0;
    if (item.size && dish.sizes.length > 0) {
      const selectedSize = dish.sizes.find((s) => s.label === item.size);
      if (selectedSize) sizeModifier = selectedSize.priceModifier;
    }

    // Calculate add-ons total
    let addOnsTotal = 0;
    const selectedAddOns: { name: string; price: number }[] = [];
    if (item.addOns && Array.isArray(item.addOns)) {
      for (const addOnName of item.addOns) {
        const addOn = dish.addOns.find((a) => a.name === addOnName);
        if (addOn) {
          selectedAddOns.push({ name: addOn.name, price: addOn.price });
          addOnsTotal += addOn.price;
        }
      }
    }

    const itemPrice = dish.price + sizeModifier + addOnsTotal;
    const subtotal = itemPrice * item.quantity;
    totalAmount += subtotal;

    orderItems.push({
      dish: dish._id,
      name: dish.name,
      price: itemPrice,
      quantity: item.quantity,
      size: item.size || 'Medium',
      addOns: selectedAddOns,
      subtotal,
      specialInstructions: item.specialInstructions || '',
    });
  }

  const order = await Order.create({
    user: req.user!._id,
    items: orderItems,
    totalAmount,
    orderType,
    tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
    notes: notes || '',
    estimatedReadyTime: new Date(Date.now() + 25 * 60 * 1000), // 25 min default
  });

  const populated = await Order.findById(order._id).populate('items.dish', 'name images');

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get user's orders
// @route   GET /api/orders/my
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const filter: any = { user: req.user!._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id).populate('items.dish', 'name images');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Ensure user owns the order (unless admin)
  if (order.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this order', 403));
  }

  res.status(200).json({ success: true, data: order });
});

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  if (order.user.toString() !== req.user!._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (order.status !== OrderStatus.PENDING) {
    return next(new ErrorResponse('Only pending orders can be cancelled', 400));
  }

  order.status = OrderStatus.CANCELLED;
  await order.save();

  res.status(200).json({ success: true, data: order });
});
