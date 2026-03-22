import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserDocument } from '../types';

const UserSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: [true, 'Full name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: { type: String, default: '' },
    passwordHash: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    avatar: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
    },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Dish' }],
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    pushToken: { type: String, default: '' },
    refreshToken: { type: String, default: '', select: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

// Generate JWT access token
UserSchema.methods.getSignedJwtToken = function (): string {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRE || '15m') as jwt.SignOptions['expiresIn'],
  });
};

// Generate refresh token
UserSchema.methods.getRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as jwt.SignOptions['expiresIn'],
  });
};

export default mongoose.model<IUserDocument>('User', UserSchema);
