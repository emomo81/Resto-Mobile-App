import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatar: string;
  address: {
    street: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  favorites: Types.ObjectId[];
  role: 'customer' | 'admin' | 'staff';
  pushToken: string;
  refreshToken: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(password: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getRefreshToken(): string;
}

export interface AuthRequest extends Request {
  user?: IUserDocument;
}
