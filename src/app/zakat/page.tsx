'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { calculateZakat, saveZakatRecord, getZakatHistory, ZakatInputs, CURRENCY_DATA } from '@/app/actions/zakatActions';
import { Loader2, Calculator, Save, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ZakatCalculatorPage() {
  const { status } = useSession();
  const [currency, setCurrency] = useState('USD');
  const [inputs, setInputs] = useState<ZakatInputs>({
    goldValue: 0,
    silverValue: 0,
    cash: 0,
    businessInventory: 0,
    investments: 0,
    otherAssets: 0,
    debts: 0,
    immediateExpenses: 0,
    goldPriceGram: 75,
    silverPriceGram: 0.90,
    nisabBasis: 'silver',
  });

  const [calcResult, setCalcResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Sync default metal rates when currency changes
  useEffect(() => {
    const currencyData = CURRENCY_DATA[currency] || CURRENCY_DATA.USD;
    setInputs(prev => ({
      ...prev,
      goldPriceGram: currencyData.goldPricePerGram,
      silverPriceGram: currencyData.silverPricePerGram,
    }));
  }, [currency]);

  const currencySymbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    PKR: '₨',
    EUR: '€',
    GBP: '£'
  };

  const symbol = currencySymbols[currency] || '$';

  useEffect(() => {
    if (status === 'authenticated') {
      getZakatHistory().then((res) => {
        if (res.success) setHistory(res.records);
        setIsLoadingHistory(false);
      });
    } else if (status === 'unauthenticated') {
      setIsLoadingHistory(false);
    }
  }, [status]);

  const handleCalculate = useCallback(async () => {
    const result = await calculateZakat(inputs, currency);
    if (result.success) {
      setCalcResult(result);
    }
  }, [inputs, currency]);

  // Recalculate if inputs/result exist
  useEffect(() => {
    if (calcResult) {
      handleCalculate();
    }
  }, [inputs, currency, handleCalculate]);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveZakatRecord(inputs, currency);
    if (res.success) {
      const historyRes = await getZakatHistory();
      if (historyRes.success) setHistory(historyRes.records);
    } else {
      alert('Failed to save record.');
    }
    setIsSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setInputs(prev => ({ ...prev, [e.target.name]: val }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold font-outfit text-emerald-800 dark:text-emerald-400">Zakat Calculator</h1>
        <p className="text-muted-foreground">Calculate and track your annual Zakat securely.</p>
      </div>

      {/* Zakat Settings & Custom Rates */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 max-w-2xl mx-auto grid md:grid-cols-2 gap-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="PKR">PKR (₨)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nisab Basis</label>
            <select
              value={inputs.nisabBasis}
              name="nisabBasis"
              onChange={(e) => setInputs(prev => ({ ...prev, nisabBasis: e.target.value as 'silver' | 'gold' }))}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="silver">Silver Nisab (612.36g) — Recommended</option>
              <option value="gold">Gold Nisab (87.48g)</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gold Price per Gram ({symbol})</label>
            <input
              type="number"
              name="goldPriceGram"
              min="0"
              value={inputs.goldPriceGram || ''}
              onChange={handleChange}
              className="w-full h-10 px-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 border-slate-200 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Silver Price per Gram ({symbol})</label>
            <input
              type="number"
              name="silverPriceGram"
              min="0"
              value={inputs.silverPriceGram || ''}
              onChange={handleChange}
              className="w-full h-10 px-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 border-slate-200 text-sm"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assets (Wealth)</h2>
            <div className="space-y-4">
              {[
                { name: 'goldValue', label: `Gold Value (${symbol})` },
                { name: 'silverValue', label: `Silver Value (${symbol})` },
                { name: 'cash', label: `Cash in Bank / Hand (${symbol})` },
                { name: 'businessInventory', label: `Business Inventory (${symbol})` },
                { name: 'investments', label: `Investments / Shares (${symbol})` },
                { name: 'otherAssets', label: `Other Assets (${symbol})` },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    min="0"
                    value={(inputs as any)[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 border-slate-200"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-red-500">Liabilities (Deductions)</h2>
            <div className="space-y-4">
              {[
                { name: 'debts', label: `Debts & Loans (${symbol})` },
                { name: 'immediateExpenses', label: `Immediate Expenses (${symbol})` },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    min="0"
                    value={(inputs as any)[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 border-slate-200"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full py-3 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-md"
          >
            <Calculator className="w-5 h-5" /> Calculate Zakat
          </button>
        </div>

        <div className="space-y-6">
          {calcResult ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator className="w-24 h-24 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-emerald-900 dark:text-emerald-300">Calculation Results</h2>
              
              <div className="space-y-2 relative z-10 text-slate-800 dark:text-slate-350">
                <div className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-2">
                  <span className="text-muted-foreground text-sm font-semibold">Total Net Worth</span>
                  <span className="font-bold">{symbol}{calcResult.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-2">
                   <span className="text-muted-foreground text-sm font-semibold">Nisab Threshold ({calcResult.nisabBasis === 'gold' ? 'Gold' : 'Silver'})</span>
                   <span className="font-bold">{symbol}{calcResult.nisabThreshold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between py-2 items-center">
                   <span className="text-muted-foreground text-sm font-semibold">Status</span>
                   {calcResult.isEligible ? (
                     <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1 text-sm">
                       <CheckCircle2 className="w-4 h-4" /> Eligible for Zakat
                     </span>
                   ) : (
                     <span className="text-red-500 font-black flex items-center gap-1 text-sm">
                       <AlertCircle className="w-4 h-4" /> Below Nisab
                     </span>
                   )}
                 </div>
               </div>
 
               <div className="bg-white dark:bg-slate-900 p-4 rounded-xl text-center shadow-sm relative z-10 border border-slate-100 dark:border-slate-850">
                 <p className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider">Total Zakat Due (2.5%)</p>
                 <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                   {symbol}{calcResult.zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </p>
               </div>

               <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center relative z-10 font-medium">
                 Calculated using Gold at {symbol}{calcResult.goldPriceUsed}/g and Silver at {symbol}{calcResult.silverPriceUsed}/g
               </div>

              {status === 'authenticated' && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2 mt-4 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all font-bold text-sm flex items-center justify-center gap-2 relative z-10 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to History
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center flex flex-col items-center justify-center h-48">
              <Calculator className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-muted-foreground text-sm font-semibold">Fill in your assets and liabilities to calculate your Zakat.</p>
            </div>
          )}

          {status === 'authenticated' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" /> Zakat History
              </h2>
              {isLoadingHistory ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((record, i) => {
                    const recSymbol = record.currency ? (currencySymbols[record.currency] || '$') : '$';
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                        <div>
                          <p className="font-semibold text-sm">Year: {record.year} {record.currency && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold ml-1 text-slate-700 dark:text-slate-300">{record.currency}</span>}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(record.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{recSymbol}{record.zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No history saved yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

