import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ErrorResponse from '../utils/ErrorResponse';
import sendTokenResponse from '../utils/sendToken';
import asyncHandler from '../middleware/asyncHandler';
import { AuthRequest } from '../types';

// @desc    Register user
// @route   POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, phone, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }

  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash: password,
  });

  await sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  await sendTokenResponse(user, 200, res);
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse('Refresh token required', 400));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    await sendTokenResponse(user, 200, res);
  } catch {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('No user found with that email', 404));
  }

  // In production, send email with reset token. For now, return success message.
  res.status(200).json({
    success: true,
    message: 'Password reset instructions sent to email',
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.passwordHash = newPassword;
  await user.save();

  await sendTokenResponse(user, 200, res);
});

// @desc    Logout
// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  if (req.user) {
    req.user.refreshToken = '';
    await req.user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message: 'Logged out' });
});
