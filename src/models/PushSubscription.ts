import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to quickly find user subscriptions and prevent duplicate subscription endpoints
PushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });

export const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
