import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPeriodTracker extends Document {
  userId: mongoose.Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  isActive: boolean;
}

const PeriodTrackerSchema = new Schema<IPeriodTracker>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PeriodTracker: Model<IPeriodTracker> = mongoose.models.PeriodTracker || mongoose.model<IPeriodTracker>('PeriodTracker', PeriodTrackerSchema);
