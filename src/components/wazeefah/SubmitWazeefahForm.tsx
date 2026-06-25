'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitWazeefah } from '@/app/actions/wazeefahActions';
import { Loader2, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { SURAHS } from './WazeefahPageClient';

const CATEGORIES = ['Rizq', 'Protection', 'Illness', 'Anxiety', 'Exams', 'Marriage', 'Forgiveness', 'Parents', 'Children'];

export function SubmitWazeefahForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quran Reference States
  const [showQuranRef, setShowQuranRef] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<typeof SURAHS[0] | null>(null);
  const [fromAyah, setFromAyah] = useState('');
  const [toAyah, setToAyah] = useState('');

  // Target & Reminder States
  const [targetCount, setTargetCount] = useState(33);
  const [reminderTime, setReminderTime] = useState('Fajr');

  const filteredSurahs = SURAHS.filter(s =>
    s.name.toLowerCase().includes(surahSearch.toLowerCase()) ||
    s.n.toString() === surahSearch.trim()
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await submitWazeefah(formData);

    setIsLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Failed to submit. Please ensure you are logged in.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left max-h-[75vh] overflow-y-auto px-1">
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-2.5 rounded-lg">{error}</p>}
      
      {/* Hidden Quran Ref for FormData */}
      <input
        type="hidden"
        name="quranRef"
        value={selectedSurah ? JSON.stringify({
          surahNumber: selectedSurah.n,
          surahName: selectedSurah.name,
          fromAyah: fromAyah ? parseInt(fromAyah, 10) : undefined,
          toAyah: toAyah ? parseInt(toAyah, 10) : undefined,
        }) : ''}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Wazeefah / Adhkar Title</label>
        <Input 
          name="title" 
          required 
          placeholder="e.g. Wazeefah for Rizq after Fajr" 
          className="border-slate-300 dark:border-slate-800"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Category</label>
        <select 
          name="category" 
          required 
          className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-800 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select Category</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Description</label>
        <Textarea 
          name="description" 
          required 
          placeholder="Briefly explain what this wazeefah is for and its source/authenticity." 
          className="border-slate-300 dark:border-slate-800"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex items-center justify-between">
          <span>Method / Instructions</span>
          <span className="text-[10px] text-muted-foreground font-normal">One step per line</span>
        </label>
        <Textarea 
          name="instructions" 
          required 
          rows={4} 
          placeholder={`Step 1: Recite Durood 3 times\nStep 2: Recite Ya Razzaqu 100 times\nStep 3: Recite Durood 3 times`} 
          className="border-slate-300 dark:border-slate-800"
        />
      </div>

      {/* Quran Reference Section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => { setShowQuranRef(v => !v); if (showQuranRef) { setSelectedSurah(null); setSurahSearch(''); setFromAyah(''); setToAyah(''); } }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer text-left"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            {selectedSurah ? `Surah ${selectedSurah.n}. ${selectedSurah.name}${fromAyah ? ` :${fromAyah}` : ''}${toAyah && toAyah !== fromAyah ? `–${toAyah}` : ''}` : 'Add Surah / Ayat (optional)'}
          </span>
          {showQuranRef ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showQuranRef && (
          <div className="border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 space-y-3">
            {/* Surah search */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search Surah</label>
              <Input
                value={surahSearch}
                onChange={e => { setSurahSearch(e.target.value); setSelectedSurah(null); }}
                placeholder="e.g. Al-Kahf or 18"
                className="bg-background border-slate-350 dark:border-slate-700 h-8 text-xs"
              />
              {surahSearch && !selectedSurah && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-background divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSurahs.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 text-center">No surah found</p>
                  ) : filteredSurahs.map(s => (
                    <button
                      key={s.n}
                      type="button"
                      onClick={() => { setSelectedSurah(s); setSurahSearch(s.name); setFromAyah(''); setToAyah(''); }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer text-left transition-colors"
                    >
                      <span><span className="text-slate-400 dark:text-slate-500 mr-1.5">{s.n}.</span>{s.name}</span>
                      <span className="text-slate-400 dark:text-slate-500">{s.ayahs} ayahs</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedSurah && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <BookOpen className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{selectedSurah.n}. {selectedSurah.name}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-auto">{selectedSurah.ayahs} ayahs</span>
                </div>
              )}
            </div>

            {/* Ayat range */}
            {selectedSurah && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">From Ayah</label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedSurah.ayahs}
                    value={fromAyah}
                    onChange={e => setFromAyah(e.target.value)}
                    placeholder={`1–${selectedSurah.ayahs}`}
                    className="bg-background border-slate-350 dark:border-slate-700 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">To Ayah</label>
                  <Input
                    type="number"
                    min={fromAyah ? parseInt(fromAyah, 10) : 1}
                    max={selectedSurah.ayahs}
                    value={toAyah}
                    onChange={e => setToAyah(e.target.value)}
                    placeholder={`up to ${selectedSurah.ayahs}`}
                    className="bg-background border-slate-350 dark:border-slate-700 h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Target Count & Reminder Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Target Count</label>
          <Input
            type="number"
            name="targetCount"
            min={1}
            required
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g. 100"
            className="border-slate-300 dark:border-slate-800"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Recommended Reminder</label>
          <select
            name="reminderTime"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Fajr">After Fajr</option>
            <option value="Dhuhr">After Dhuhr</option>
            <option value="Asr">After Asr</option>
            <option value="Maghrib">After Maghrib</option>
            <option value="Isha">After Isha</option>
            <option value="Morning">Morning Adhkar</option>
            <option value="Evening">Evening Adhkar</option>
            <option value="Before Sleep">Before Sleep</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Submit for Approval
      </Button>
    </form>
  );
}
