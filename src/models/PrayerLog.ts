import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPrayerLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  fajr: 'completed' | 'qaza' | 'missed' | 'excused' | 'pending';
  dhuhr: 'completed' | 'qaza' | 'missed' | 'excused' | 'pending';
  asr: 'completed' | 'qaza' | 'missed' | 'excused' | 'pending';
  maghrib: 'completed' | 'qaza' | 'missed' | 'excused' | 'pending';
  isha: 'completed' | 'qaza' | 'missed' | 'excused' | 'pending';
  completionPercentage: number;
}

const PrayerLogSchema = new Schema<IPrayerLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    fajr: { type: String, enum: ['completed', 'qaza', 'missed', 'excused', 'pending'], default: 'pending' },
    dhuhr: { type: String, enum: ['completed', 'qaza', 'missed', 'excused', 'pending'], default: 'pending' },
    asr: { type: String, enum: ['completed', 'qaza', 'missed', 'excused', 'pending'], default: 'pending' },
    maghrib: { type: String, enum: ['completed', 'qaza', 'missed', 'excused', 'pending'], default: 'pending' },
    isha: { type: String, enum: ['completed', 'qaza', 'missed', 'excused', 'pending'], default: 'pending' },
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PrayerLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const PrayerLog: Model<IPrayerLog> = mongoose.models.PrayerLog || mongoose.model<IPrayerLog>('PrayerLog', PrayerLogSchema);
