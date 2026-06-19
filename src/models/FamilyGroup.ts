import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFamilyGroup extends Document {
  name: string;
  joinCode: string;
  adminId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
}

const FamilyGroupSchema = new Schema<IFamilyGroup>(
  {
    name: { type: String, required: true },
    joinCode: { type: String, required: true, unique: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const FamilyGroup: Model<IFamilyGroup> = mongoose.models.FamilyGroup || mongoose.model<IFamilyGroup>('FamilyGroup', FamilyGroupSchema);
