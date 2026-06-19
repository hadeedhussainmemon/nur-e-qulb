import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuranProgress extends Document {
  userId: mongoose.Types.ObjectId;
  juzProgress: {
    juzNumber: number;
    completed: boolean;
  }[];
  khatmCount: number;
  overallPercentage: number;
  targetDate?: Date;
  startDate?: Date;
}

const QuranProgressSchema = new Schema<IQuranProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    juzProgress: [
      {
        juzNumber: { type: Number, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    khatmCount: { type: Number, default: 0 },
    overallPercentage: { type: Number, default: 0 },
    targetDate: { type: Date },
    startDate: { type: Date },
  },
  { timestamps: true }
);

export const QuranProgress: Model<IQuranProgress> = mongoose.models.QuranProgress || mongoose.model<IQuranProgress>('QuranProgress', QuranProgressSchema);
