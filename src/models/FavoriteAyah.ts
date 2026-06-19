import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFavoriteAyah extends Document {
  userId: mongoose.Types.ObjectId;
  surahNumber: number;
  ayahNumber: number;
}

const FavoriteAyahSchema = new Schema<IFavoriteAyah>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    surahNumber: { type: Number, required: true },
    ayahNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

FavoriteAyahSchema.index({ userId: 1, surahNumber: 1, ayahNumber: 1 }, { unique: true });

export const FavoriteAyah: Model<IFavoriteAyah> = mongoose.models.FavoriteAyah || mongoose.model<IFavoriteAyah>('FavoriteAyah', FavoriteAyahSchema);
