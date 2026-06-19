import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFastingLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  type: 'ramadan' | 'sunnah_monday' | 'sunnah_thursday' | 'white_days' | 'ashura' | 'arafah' | 'makeup' | 'nafl';
  status: 'intended' | 'completed' | 'broken';
  notes?: string;
}

const FastingLogSchema = new Schema<IFastingLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    type: { 
      type: String, 
      enum: ['ramadan', 'sunnah_monday', 'sunnah_thursday', 'white_days', 'ashura', 'arafah', 'makeup', 'nafl'],
      required: true 
    },
    status: {
      type: String,
      enum: ['intended', 'completed', 'broken'],
      default: 'completed'
    },
    notes: { type: String },
  },
  { timestamps: true }
);

FastingLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const FastingLog: Model<IFastingLog> = mongoose.models.FastingLog || mongoose.model<IFastingLog>('FastingLog', FastingLogSchema);
