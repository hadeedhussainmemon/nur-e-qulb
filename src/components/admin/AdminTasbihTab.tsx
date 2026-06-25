'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { saveTasbihPreset, deleteTasbihPreset } from '@/app/actions/adminActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminTasbihTab({
  initialPresets,
  onUpdatePresets,
}: {
  initialPresets: any[];
  onUpdatePresets: (list: any[]) => void;
}) {
  const [presets, setPresets] = useState(initialPresets);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Form states
  const [presetId, setPresetId] = useState('');
  const [text, setText] = useState('');
  const [arabic, setArabic] = useState('');
  const [target, setTarget] = useState(33);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !text || !arabic) {
      alert('Please fill in all fields');
      return;
    }

    const cleanId = presetId.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!cleanId) {
      alert('ID must contain alphanumeric characters only.');
      return;
    }

    setLoadingActionId('submit');
    try {
      const res = await saveTasbihPreset(cleanId, text.trim(), arabic.trim(), target);
      if (res.success) {
        // Update local list
        const updatedPreset = { id: cleanId, text: text.trim(), arabic: arabic.trim(), target };
        const exists = presets.some(p => p.id === cleanId);
        if (exists) {
          setPresets(presets.map(p => (p.id === cleanId ? updatedPreset : p)));
        } else {
          setPresets([...presets, updatedPreset]);
        }
        onUpdatePresets(exists ? presets.map(p => (p.id === cleanId ? updatedPreset : p)) : [...presets, updatedPreset]);

        // Reset form
        setPresetId('');
        setText('');
        setArabic('');
        setTarget(33);
        alert('Tasbih preset saved successfully!');
      } else {
        alert(res.error || 'Failed to save preset.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tasbih preset? Users will no longer see it in their tasbih counter options.')) {
      return;
    }

    setLoadingActionId(`del-${id}`);
    try {
      const res = await deleteTasbihPreset(id);
      if (res.success) {
        setPresets(presets.filter(p => p.id !== id));
        onUpdatePresets(presets.filter(p => p.id !== id));
      } else {
        alert(res.error || 'Failed to delete preset.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Editor Form */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit bg-white dark:bg-slate-950/20">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
          <CardTitle className="text-base flex items-center gap-1.5 text-slate-850 dark:text-slate-200">
            <Sparkles className="w-5 h-5 text-emerald-500" /> Save Tasbih Preset
          </CardTitle>
          <CardDescription>Create a new tasbeeh or edit an existing one by entering its ID.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Unique ID (lowercase slug)</label>
              <Input
                value={presetId}
                onChange={e => setPresetId(e.target.value)}
                placeholder="e.g. subhanallah"
                required
                className="h-9 border-slate-300 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">English Translation / Phrase</label>
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. Subhanallah"
                required
                className="h-9 border-slate-300 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Arabic Script</label>
              <Input
                value={arabic}
                onChange={e => setArabic(e.target.value)}
                placeholder="e.g. سُبْحَانَ ٱللَّٰهِ"
                required
                className="h-9 text-right font-sans border-slate-300 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Target Count</label>
              <Input
                type="number"
                min={1}
                value={target}
                onChange={e => setTarget(parseInt(e.target.value, 10) || 33)}
                required
                className="h-9 border-slate-300 dark:border-slate-800"
              />
            </div>

            <Button type="submit" disabled={loadingActionId !== null} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 mt-2">
              {loadingActionId === 'submit' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Preset
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950/20">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
          <CardTitle className="text-base text-slate-850 dark:text-slate-200">Active Tasbihat Presets</CardTitle>
          <CardDescription>Available dhikrs that users can choose from in their Tasbih Counter widget.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-850">
            <table className="w-full border-collapse text-left text-xs bg-white dark:bg-slate-950/20">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                  <th className="p-3">ID / Slug</th>
                  <th className="p-3">Dhikr Phrase</th>
                  <th className="p-3 text-right">Arabic Text</th>
                  <th className="p-3 text-center">Target</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {presets.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                    <td className="p-3 font-mono font-bold text-slate-500 dark:text-slate-450">{p.id}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{p.text}</td>
                    <td className="p-3 text-right font-sans text-sm text-slate-800 dark:text-slate-200">{p.arabic}</td>
                    <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{p.target}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={loadingActionId !== null}
                        className="p-1.5 rounded-lg border border-rose-200 hover:border-rose-300 dark:border-rose-900 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                        title="Delete Preset"
                      >
                        {loadingActionId === `del-${p.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
