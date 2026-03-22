import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReviewDocument extends Document {
  user: Types.ObjectId;
  dish: Types.ObjectId;
  rating: number;
  comment: string;
  images: string[];
  createdAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dish: { type: Schema.Types.ObjectId, ref: 'Dish', required: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    comment: { type: String, default: '' },
    images: [{ type: String }],
  },
  { timestamps: true }
);

// One review per user per dish
ReviewSchema.index({ user: 1, dish: 1 }, { unique: true });

// Recalculate dish rating after save
ReviewSchema.post('save', async function () {
  const Review = this.constructor as mongoose.Model<IReviewDocument>;
  const stats = await Review.aggregate([
    { $match: { dish: this.dish } },
    { $group: { _id: '$dish', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Dish').findByIdAndUpdate(this.dish, {
      'rating.average': Math.round(stats[0].average * 10) / 10,
      'rating.count': stats[0].count,
    });
  }
});

// Recalculate on delete
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const stats = await mongoose.model('Review').aggregate([
      { $match: { dish: doc.dish } },
      { $group: { _id: '$dish', average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const update = stats.length > 0
      ? { 'rating.average': Math.round(stats[0].average * 10) / 10, 'rating.count': stats[0].count }
      : { 'rating.average': 0, 'rating.count': 0 };

    await mongoose.model('Dish').findByIdAndUpdate(doc.dish, update);
  }
});

export default mongoose.model<IReviewDocument>('Review', ReviewSchema);
