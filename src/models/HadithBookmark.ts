import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHadithBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  collectionName: string; // e.g. 'bukhari'
  bookNumber: string;
  hadithNumber: string;
  note?: string;
}

const HadithBookmarkSchema = new Schema<IHadithBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collectionName: { type: String, required: true },
    bookNumber: { type: String, required: true },
    hadithNumber: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

HadithBookmarkSchema.index({ userId: 1, collectionName: 1, hadithNumber: 1 }, { unique: true });
// Optimize sorting by createdAt
HadithBookmarkSchema.index({ userId: 1, createdAt: -1 });

export const HadithBookmark: Model<IHadithBookmark> = mongoose.models.HadithBookmark || mongoose.model<IHadithBookmark>('HadithBookmark', HadithBookmarkSchema);
