import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAudioHistory extends Document {
  userId: mongoose.Types.ObjectId;
  surahNumber: number;
  reciterIdentifier: string; // e.g. "ar.alafasy"
  lastPlayedAt: Date;
}

const AudioHistorySchema = new Schema<IAudioHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    surahNumber: { type: Number, required: true },
    reciterIdentifier: { type: String, required: true },
    lastPlayedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AudioHistorySchema.index({ userId: 1, surahNumber: 1, reciterIdentifier: 1 }, { unique: true });

export const AudioHistory: Model<IAudioHistory> = mongoose.models.AudioHistory || mongoose.model<IAudioHistory>('AudioHistory', AudioHistorySchema);
