import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRateLimit extends Document {
  ip: string;
  endpoint: string;
  count: number;
  expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  ip: { type: String, required: true },
  endpoint: { type: String, required: true },
  count: { type: Number, default: 1 },
  expiresAt: { type: Date, required: true, expires: 0 } // TTL index automatically deletes document when current time >= expiresAt
});

// Compound index to quickly find limits per IP per endpoint
RateLimitSchema.index({ ip: 1, endpoint: 1 }, { unique: true });

export const RateLimit: Model<IRateLimit> = mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);
