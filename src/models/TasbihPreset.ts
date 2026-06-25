import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITasbihPreset extends Document {
  id: string;
  text: string;
  arabic: string;
  target: number;
}

const TasbihPresetSchema = new Schema<ITasbihPreset>(
  {
    id: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    arabic: { type: String, required: true },
    target: { type: Number, required: true, default: 33 },
  },
  { timestamps: true }
);

export const TasbihPreset: Model<ITasbihPreset> =
  mongoose.models.TasbihPreset || mongoose.model<ITasbihPreset>('TasbihPreset', TasbihPresetSchema);
