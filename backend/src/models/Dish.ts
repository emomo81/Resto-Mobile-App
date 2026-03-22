import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDishDocument extends Document {
  name: string;
  description: string;
  price: number;
  images: string[];
  category: Types.ObjectId;
  tags: string[];
  addOns: { name: string; price: number; image: string }[];
  sizes: { label: string; priceModifier: number }[];
  preparationTime: number;
  rating: { average: number; count: number };
  isAvailable: boolean;
  isFeatured: boolean;
  calories: number;
  ingredients: string[];
  createdAt: Date;
}

const DishSchema = new Schema<IDishDocument>(
  {
    name: { type: String, required: [true, 'Dish name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    tags: [{ type: String, enum: ['spicy', 'vegan', 'bestseller', 'new', 'gluten-free', 'vegetarian', 'healthy'] }],
    addOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, default: '' },
      },
    ],
    sizes: [
      {
        label: { type: String, enum: ['Small', 'Medium', 'Large'], required: true },
        priceModifier: { type: Number, required: true, default: 0 },
      },
    ],
    preparationTime: { type: Number, default: 15 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isAvailable: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    calories: { type: Number, default: 0 },
    ingredients: [{ type: String }],
  },
  { timestamps: true }
);

DishSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IDishDocument>('Dish', DishSchema);
