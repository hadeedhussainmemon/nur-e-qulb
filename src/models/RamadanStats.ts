import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRamadanStats extends Document {
  userId: mongoose.Types.ObjectId;
  year: number; // Hijri year, e.g., 1447
  fastsCompleted: number;
  fastsMissed: number;
  taraweehCompleted: number;
}

const RamadanStatsSchema = new Schema<IRamadanStats>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    fastsCompleted: { type: Number, default: 0 },
    fastsMissed: { type: Number, default: 0 },
    taraweehCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RamadanStatsSchema.index({ userId: 1, year: 1 }, { unique: true });

export const RamadanStats: Model<IRamadanStats> = mongoose.models.RamadanStats || mongoose.model<IRamadanStats>('RamadanStats', RamadanStatsSchema);
