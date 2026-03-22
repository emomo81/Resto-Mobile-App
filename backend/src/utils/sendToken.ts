import { Response } from 'express';
import { IUserDocument } from '../types';

const sendTokenResponse = async (user: IUserDocument, statusCode: number, res: Response) => {
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Save refresh token to user document
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      favorites: user.favorites,
    },
  });
};

export default sendTokenResponse;
