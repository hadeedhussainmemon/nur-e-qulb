import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  notifications: {
    prayerReminders: boolean;
    dailyAyah: boolean;
    dailyHadith: boolean;
    fridayReminders: boolean;
    ramadanReminders: boolean;
  };
  prayerCalculationMethod: string;
  madhab: string;
  theme: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    notifications: {
      prayerReminders: { type: Boolean, default: true },
      dailyAyah: { type: Boolean, default: true },
      dailyHadith: { type: Boolean, default: true },
      fridayReminders: { type: Boolean, default: true },
      ramadanReminders: { type: Boolean, default: true },
    },
    prayerCalculationMethod: { type: String, default: 'ISNA' },
    madhab: { type: String, default: 'Hanafi' },
    theme: { type: String, default: 'default' },
  },
  { timestamps: true }
);

export const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
