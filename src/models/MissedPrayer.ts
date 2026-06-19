import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMissedPrayer extends Document {
  userId: mongoose.Types.ObjectId;
  prayerName: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr';
  count: number;
}

const MissedPrayerSchema = new Schema<IMissedPrayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    prayerName: { type: String, enum: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'], required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

MissedPrayerSchema.index({ userId: 1, prayerName: 1 }, { unique: true });

export const MissedPrayer: Model<IMissedPrayer> = mongoose.models.MissedPrayer || mongoose.model<IMissedPrayer>('MissedPrayer', MissedPrayerSchema);
