import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserWazeefah extends Document {
  userId: mongoose.Types.ObjectId;
  wazeefahId?: mongoose.Types.ObjectId; // Ref to community Wazeefah, if applicable
  title: string;
  description?: string;
  instructions?: string[];
  targetCount: number;
  completions: {
    date: string; // Format: 'YYYY-MM-DD'
    count: number;
  }[];
  reminderTime?: string; // e.g. '06:00' or 'Fajr', 'Maghrib'
  isCustom: boolean;
  isActive: boolean;
}

const UserWazeefahSchema = new Schema<IUserWazeefah>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wazeefahId: { type: Schema.Types.ObjectId, ref: 'Wazeefah' },
    title: { type: String, required: true },
    description: { type: String },
    instructions: [{ type: String }],
    targetCount: { type: Number, default: 33, required: true },
    completions: [
      {
        date: { type: String, required: true },
        count: { type: Number, required: true, default: 0 },
      },
    ],
    reminderTime: { type: String },
    isCustom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for fast retrieval
UserWazeefahSchema.index({ userId: 1, isActive: 1 });

export const UserWazeefah: Model<IUserWazeefah> = mongoose.models.UserWazeefah || mongoose.model<IUserWazeefah>('UserWazeefah', UserWazeefahSchema);
