import mongoose, { Document, Schema, Types } from 'mongoose';
import { OrderStatus, PaymentStatus, OrderType } from '../config/constants';

export interface IOrderDocument extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: {
    dish: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    size: string;
    addOns: { name: string; price: number }[];
    subtotal: number;
    specialInstructions: string;
  }[];
  totalAmount: number;
  status: OrderStatus;
  orderType: OrderType;
  tableNumber: number;
  estimatedReadyTime: Date;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        dish: { type: Schema.Types.ObjectId, ref: 'Dish', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String, default: 'Medium' },
        addOns: [{ name: String, price: Number }],
        subtotal: { type: Number, required: true },
        specialInstructions: { type: String, default: '' },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      required: [true, 'Order type is required'],
    },
    tableNumber: { type: Number, default: 0 },
    estimatedReadyTime: { type: Date },
    paymentMethod: { type: String, default: 'pay-at-counter' },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate order number before save
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      },
    });
    this.orderNumber = `MR-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model<IOrderDocument>('Order', OrderSchema);
