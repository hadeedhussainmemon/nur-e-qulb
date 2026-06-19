import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWazeefah extends Document {
  title: string;
  description: string;
  category: 'Rizq' | 'Protection' | 'Illness' | 'Anxiety' | 'Exams' | 'Marriage' | 'Forgiveness' | 'Parents' | 'Children';
  instructions: string[];
  submittedBy: mongoose.Types.ObjectId;
  isApproved: boolean;
  authenticityScore: number;
  likesCount: number;
}

const WazeefahSchema = new Schema<IWazeefah>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Rizq', 'Protection', 'Illness', 'Anxiety', 'Exams', 'Marriage', 'Forgiveness', 'Parents', 'Children'],
      required: true,
    },
    instructions: [{ type: String, required: true }],
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isApproved: { type: Boolean, default: false },
    authenticityScore: { type: Number, default: 0, min: 0, max: 100 },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for quick fetching of approved Wazeefahs
WazeefahSchema.index({ isApproved: 1, category: 1 });

export const Wazeefah: Model<IWazeefah> = mongoose.models.Wazeefah || mongoose.model<IWazeefah>('Wazeefah', WazeefahSchema);
