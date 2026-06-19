import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'prayer' | 'ayah' | 'hadith' | 'system' | 'wazeefah';
  isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['prayer', 'ayah', 'hadith', 'system', 'wazeefah'], required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
