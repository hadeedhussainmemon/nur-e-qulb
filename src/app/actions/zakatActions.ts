'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { ZakatRecord } from '@/models/ZakatRecord';

export const CURRENCY_DATA: Record<string, { symbol: string; goldPricePerGram: number; silverPricePerGram: number }> = {
  USD: { symbol: '$', goldPricePerGram: 75, silverPricePerGram: 0.90 },
  INR: { symbol: '₹', goldPricePerGram: 6200, silverPricePerGram: 78 },
  PKR: { symbol: '₨', goldPricePerGram: 20000, silverPricePerGram: 260 },
  EUR: { symbol: '€', goldPricePerGram: 69, silverPricePerGram: 0.83 },
  GBP: { symbol: '£', goldPricePerGram: 58, silverPricePerGram: 0.70 }
};

const zakatSchema = z.object({
  goldValue: z.number().min(0).default(0),
  silverValue: z.number().min(0).default(0),
  cash: z.number().min(0).default(0),
  businessInventory: z.number().min(0).default(0),
  investments: z.number().min(0).default(0),
  otherAssets: z.number().min(0).default(0),
  debts: z.number().min(0).default(0),
  immediateExpenses: z.number().min(0).default(0),
});

export type ZakatInputs = z.infer<typeof zakatSchema>;

export async function calculateZakat(inputs: ZakatInputs, currency = 'USD') {
  const parseResult = zakatSchema.safeParse(inputs);
  if (!parseResult.success) {
    throw new Error('Invalid inputs for Zakat calculation');
  }

  const data = parseResult.data;
  const currencyData = CURRENCY_DATA[currency] || CURRENCY_DATA.USD;

  const totalAssets = 
    data.goldValue + 
    data.silverValue + 
    data.cash + 
    data.businessInventory + 
    data.investments + 
    data.otherAssets;

  const totalLiabilities = data.debts + data.immediateExpenses;
  
  const netWorth = totalAssets - totalLiabilities;

  // Nisab is traditionally based on Gold (87.48g) or Silver (612.36g). 
  const nisabSilver = 612.36 * currencyData.silverPricePerGram;
  const nisabGold = 87.48 * currencyData.goldPricePerGram;
  
  // Use Silver Nisab by default for strictness, but let user know.
  const nisabThreshold = nisabSilver;

  const isEligible = netWorth >= nisabThreshold;
  const zakatDue = isEligible ? netWorth * 0.025 : 0;

  return {
    success: true,
    netWorth,
    nisabThreshold,
    isEligible,
    zakatDue,
    currency,
    symbol: currencyData.symbol,
  };
}

export async function saveZakatRecord(inputs: ZakatInputs, currency = 'USD') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const calc = await calculateZakat(inputs, currency);
    if (!calc.success) throw new Error('Calculation failed');

    const record = await ZakatRecord.create({
      userId: user._id,
      year: new Date().getFullYear(),
      currency,
      assets: {
        goldValue: inputs.goldValue,
        silverValue: inputs.silverValue,
        cash: inputs.cash,
        businessInventory: inputs.businessInventory,
        investments: inputs.investments,
        otherAssets: inputs.otherAssets,
      },
      liabilities: {
        debts: inputs.debts,
        immediateExpenses: inputs.immediateExpenses,
      },
      netWorth: calc.netWorth,
      nisabThreshold: calc.nisabThreshold,
      isEligible: calc.isEligible,
      zakatDue: calc.zakatDue,
    });

    return { success: true, recordId: record._id.toString() };
  } catch (error: any) {
    console.error('Failed to save Zakat record:', error);
    return { success: false, error: error.message };
  }
}

export async function getZakatHistory() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const records = await ZakatRecord.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    
    return { success: true, records: JSON.parse(JSON.stringify(records)) };
  } catch (error: any) {
    console.error('Failed to fetch Zakat history:', error);
    return { success: false, error: error.message };
  }
}

