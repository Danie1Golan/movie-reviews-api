import { Schema, model } from 'mongoose';

export interface IMovie {
  title: string;
  year: number;
  genre: string;
  director: string;
  actors: string[];
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const movieSchema = new Schema<IMovie>({
  title: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1888 },
  genre: { type: String, required: true, trim: true },
  director: { type: String, required: true, trim: true },
  actors: { type: [String], required: true, default: [] },
  description: { type: String, required: true, trim: true }
}, { timestamps: true });

movieSchema.index({ title: 1, year: 1 });
export const Movie = model<IMovie>('Movie', movieSchema);
