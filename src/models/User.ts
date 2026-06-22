import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  isGuest: boolean;
  gender?: 'male' | 'female' | 'other';
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  language: string;
  themePreference: 'light' | 'dark' | 'system';
  onboardingCompleted: boolean;
  lastPrayerSyncDate?: string;
  hijriAdjustment?: number;
  settingsId?: mongoose.Types.ObjectId;
  role: 'user' | 'admin';
  familyId?: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    isGuest: { type: Boolean, default: false },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    location: {
      country: { type: String },
      city: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    language: { type: String, default: 'en' },
    themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    onboardingCompleted: { type: Boolean, default: false },
    lastPrayerSyncDate: { type: String },
    hijriAdjustment: { type: Number, default: 0 },
    settingsId: { type: Schema.Types.ObjectId, ref: 'Settings' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    familyId: { type: Schema.Types.ObjectId, ref: 'FamilyGroup' },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
