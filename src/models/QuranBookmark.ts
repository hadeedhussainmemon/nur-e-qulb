import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuranBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  surahNumber: number;
  ayahNumber: number;
  note?: string;
}

const QuranBookmarkSchema = new Schema<IQuranBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    surahNumber: { type: Number, required: true },
    ayahNumber: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

QuranBookmarkSchema.index({ userId: 1, surahNumber: 1, ayahNumber: 1 }, { unique: true });
// Optimize sorting by createdAt
QuranBookmarkSchema.index({ userId: 1, createdAt: -1 });

export const QuranBookmark: Model<IQuranBookmark> = mongoose.models.QuranBookmark || mongoose.model<IQuranBookmark>('QuranBookmark', QuranBookmarkSchema);
