import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPromotionDocument extends Document {
  title: string;
  description: string;
  image: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableDishes: Types.ObjectId[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

const PromotionSchema = new Schema<IPromotionDocument>(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    applicableDishes: [{ type: Schema.Types.ObjectId, ref: 'Dish' }],
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPromotionDocument>('Promotion', PromotionSchema);
