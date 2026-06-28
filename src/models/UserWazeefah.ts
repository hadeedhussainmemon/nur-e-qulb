import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserWazeefah extends Document {
  userId: mongoose.Types.ObjectId;
  wazeefahId?: mongoose.Types.ObjectId; // Ref to community Wazeefah, if applicable
  title: string;
  description?: string;
  instructions?: string[];
  quranRef?: {
    surahNumber: number;
    surahName: string;
    fromAyah?: number;
    toAyah?: number;
  };
  targetCount: number;
  completions: {
    date: string; // Format: 'YYYY-MM-DD'
    count: number;
  }[];
  reminderTime?: string; // e.g. '06:00' or 'Fajr', 'Maghrib'
  isCustom: boolean;
  isActive: boolean;
  reference?: string;
  reminderDays: number[];
}

const UserWazeefahSchema = new Schema<IUserWazeefah>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wazeefahId: { type: Schema.Types.ObjectId, ref: 'Wazeefah' },
    title: { type: String, required: true },
    description: { type: String },
    instructions: [{ type: String }],
    quranRef: {
      surahNumber: { type: Number },
      surahName: { type: String },
      fromAyah: { type: Number },
      toAyah: { type: Number },
    },
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
    reference: { type: String },
    reminderDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
  },
  { timestamps: true }
);

// Indexes for fast retrieval
UserWazeefahSchema.index({ userId: 1, isActive: 1 });

export const UserWazeefah: Model<IUserWazeefah> = mongoose.models.UserWazeefah || mongoose.model<IUserWazeefah>('UserWazeefah', UserWazeefahSchema);
