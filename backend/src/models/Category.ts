import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CategorySchema.virtual('dishes', {
  ref: 'Dish',
  localField: '_id',
  foreignField: 'category',
  justOne: false,
});

export default mongoose.model<ICategoryDocument>('Category', CategorySchema);
