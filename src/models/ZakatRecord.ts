import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IZakatRecord extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  assets: {
    goldValue: number;
    silverValue: number;
    cash: number;
    businessInventory: number;
    investments: number;
    otherAssets: number;
  };
  liabilities: {
    debts: number;
    immediateExpenses: number;
  };
  netWorth: number;
  nisabThreshold: number;
  isEligible: boolean;
  zakatDue: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ZakatRecordSchema = new Schema<IZakatRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    assets: {
      goldValue: { type: Number, default: 0 },
      silverValue: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      businessInventory: { type: Number, default: 0 },
      investments: { type: Number, default: 0 },
      otherAssets: { type: Number, default: 0 },
    },
    liabilities: {
      debts: { type: Number, default: 0 },
      immediateExpenses: { type: Number, default: 0 },
    },
    netWorth: { type: Number, required: true },
    nisabThreshold: { type: Number, required: true },
    isEligible: { type: Boolean, required: true },
    zakatDue: { type: Number, required: true },
  },
  { timestamps: true }
);

// Indexes
ZakatRecordSchema.index({ userId: 1, year: -1 });

export const ZakatRecord: Model<IZakatRecord> = mongoose.models.ZakatRecord || mongoose.model<IZakatRecord>('ZakatRecord', ZakatRecordSchema);
