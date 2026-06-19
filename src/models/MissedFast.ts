import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMissedFast extends Document {
  userId: mongoose.Types.ObjectId;
  count: number;
}

const MissedFastSchema = new Schema<IMissedFast>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const MissedFast: Model<IMissedFast> = mongoose.models.MissedFast || mongoose.model<IMissedFast>('MissedFast', MissedFastSchema);
