import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILastRead extends Document {
  userId: mongoose.Types.ObjectId;
  surahNumber: number;
  ayahNumber: number;
}

const LastReadSchema = new Schema<ILastRead>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    surahNumber: { type: Number, required: true },
    ayahNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

export const LastRead: Model<ILastRead> = mongoose.models.LastRead || mongoose.model<ILastRead>('LastRead', LastReadSchema);
