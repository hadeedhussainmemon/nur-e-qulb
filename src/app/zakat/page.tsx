'use client';

import React, { useState, useEffect } from 'react';
import { calculateZakat, saveZakatRecord, getZakatHistory, ZakatInputs } from '@/app/actions/zakatActions';
import { Loader2, Calculator, Save, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ZakatCalculatorPage() {
  const { status } = useSession();
  const [inputs, setInputs] = useState<ZakatInputs>({
    goldValue: 0,
    silverValue: 0,
    cash: 0,
    businessInventory: 0,
    investments: 0,
    otherAssets: 0,
    debts: 0,
    immediateExpenses: 0,
  });

  const [calcResult, setCalcResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

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

  const handleCalculate = async () => {
    const result = await calculateZakat(inputs);
    if (result.success) {
      setCalcResult(result);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveZakatRecord(inputs);
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

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assets (Wealth)</h2>
            <div className="space-y-4">
              {[
                { name: 'goldValue', label: 'Gold Value (USD)' },
                { name: 'silverValue', label: 'Silver Value (USD)' },
                { name: 'cash', label: 'Cash in Bank / Hand (USD)' },
                { name: 'businessInventory', label: 'Business Inventory (USD)' },
                { name: 'investments', label: 'Investments / Shares (USD)' },
                { name: 'otherAssets', label: 'Other Assets (USD)' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    min="0"
                    value={(inputs as any)[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
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
                { name: 'debts', label: 'Debts & Loans (USD)' },
                { name: 'immediateExpenses', label: 'Immediate Expenses (USD)' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    min="0"
                    value={(inputs as any)[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" /> Calculate Zakat
          </button>
        </div>

        <div className="space-y-6">
          {calcResult ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator className="w-24 h-24 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-emerald-900 dark:text-emerald-300">Calculation Results</h2>
              
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-2">
                  <span className="text-muted-foreground">Total Net Worth</span>
                  <span className="font-semibold">${calcResult.netWorth.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-2">
                  <span className="text-muted-foreground">Nisab Threshold (Silver)</span>
                  <span className="font-semibold">${calcResult.nisabThreshold.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status</span>
                  {calcResult.isEligible ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Eligible for Zakat
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Below Nisab
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl text-center shadow-sm relative z-10">
                <p className="text-sm text-muted-foreground mb-1">Total Zakat Due (2.5%)</p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${calcResult.zakatDue.toFixed(2)}
                </p>
              </div>

              {status === 'authenticated' && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2 mt-4 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center justify-center gap-2 relative z-10"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to History
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center h-48">
              <Calculator className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-muted-foreground">Fill in your assets and liabilities to calculate your Zakat.</p>
            </div>
          )}

          {status === 'authenticated' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                <History className="w-5 h-5" /> Zakat History
              </h2>
              {isLoadingHistory ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                      <div>
                        <p className="font-medium">Year: {record.year}</p>
                        <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">${record.zakatDue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
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
