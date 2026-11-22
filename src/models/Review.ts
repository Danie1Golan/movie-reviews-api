import { Schema, model, Types } from 'mongoose';

export interface IReview {
  movieId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<IReview>({
  movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 10 },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

// Clear business rule: one review per user per movie.
reviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
