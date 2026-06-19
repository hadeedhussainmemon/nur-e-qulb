import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFamilyChallengeProgress {
  userId: mongoose.Types.ObjectId;
  count: number;
}

export interface IFamilyChallenge extends Document {
  familyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'quran' | 'dhikr' | 'fasting' | 'prayers';
  target: number;
  progress: IFamilyChallengeProgress[];
  endDate: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyChallengeSchema = new Schema<IFamilyChallenge>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'FamilyGroup', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { 
      type: String, 
      enum: ['quran', 'dhikr', 'fasting', 'prayers'], 
      required: true 
    },
    target: { type: Number, required: true },
    progress: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        count: { type: Number, required: true, default: 0 }
      }
    ],
    endDate: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const FamilyChallenge: Model<IFamilyChallenge> = 
  mongoose.models.FamilyChallenge || mongoose.model<IFamilyChallenge>('FamilyChallenge', FamilyChallengeSchema);
