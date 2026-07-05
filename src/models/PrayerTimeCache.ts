import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrayerTimeCache extends Document {
  city: string;
  country: string;
  method: string;
  school: string;
  dateStr: string; // YYYY-MM-DD
  timings: Record<string, string>;
  timezone: string;
  createdAt: Date;
}

const PrayerTimeCacheSchema = new Schema<IPrayerTimeCache>({
  city: { type: String, required: true },
  country: { type: String, required: true },
  method: { type: String, required: true },
  school: { type: String, required: true },
  dateStr: { type: String, required: true },
  timings: { type: Map, of: String, required: true },
  timezone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // automatic TTL index expires in 24 hours
});

// Compound index to guarantee uniqueness for lookups
PrayerTimeCacheSchema.index({ city: 1, country: 1, method: 1, school: 1, dateStr: 1 }, { unique: true });

export const PrayerTimeCache: Model<IPrayerTimeCache> =
  mongoose.models.PrayerTimeCache || mongoose.model<IPrayerTimeCache>('PrayerTimeCache', PrayerTimeCacheSchema);
