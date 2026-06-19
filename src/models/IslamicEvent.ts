import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IIslamicEvent extends Document {
  name: string;
  hijriDate: string; // e.g., '09-01' for 1st Ramadan
  gregorianDateEstimate?: string;
  type: 'holiday' | 'fasting' | 'historical';
  description?: string;
}

const IslamicEventSchema = new Schema<IIslamicEvent>(
  {
    name: { type: String, required: true, unique: true },
    hijriDate: { type: String, required: true },
    gregorianDateEstimate: { type: String },
    type: { type: String, enum: ['holiday', 'fasting', 'historical'], required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const IslamicEvent: Model<IIslamicEvent> = mongoose.models.IslamicEvent || mongoose.model<IIslamicEvent>('IslamicEvent', IslamicEventSchema);
