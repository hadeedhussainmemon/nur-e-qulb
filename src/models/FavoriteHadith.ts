import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFavoriteHadith extends Document {
  userId: mongoose.Types.ObjectId;
  collectionName: string;
  hadithNumber: string;
}

const FavoriteHadithSchema = new Schema<IFavoriteHadith>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collectionName: { type: String, required: true },
    hadithNumber: { type: String, required: true },
  },
  { timestamps: true }
);

FavoriteHadithSchema.index({ userId: 1, collectionName: 1, hadithNumber: 1 }, { unique: true });

export const FavoriteHadith: Model<IFavoriteHadith> = mongoose.models.FavoriteHadith || mongoose.model<IFavoriteHadith>('FavoriteHadith', FavoriteHadithSchema);
