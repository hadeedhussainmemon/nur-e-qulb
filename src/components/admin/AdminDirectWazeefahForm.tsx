'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createAndPublishWazeefah } from '@/app/actions/wazeefahActions';
import { Loader2, Plus, Sparkles, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { SURAHS } from '../wazeefah/WazeefahPageClient';

const CATEGORIES = ['Rizq', 'Protection', 'Illness', 'Anxiety', 'Exams', 'Marriage', 'Forgiveness', 'Parents', 'Children'];

export function AdminDirectWazeefahForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('');
  const [description, setDescription] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [score, setScore] = useState(90);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !description || !instructionsText) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const instructions = instructionsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const quranRef = selectedSurah
      ? {
          surahNumber: selectedSurah.n,
          surahName: selectedSurah.name,
          fromAyah: fromAyah ? parseInt(fromAyah, 10) : undefined,
          toAyah: toAyah ? parseInt(toAyah, 10) : undefined,
        }
      : null;

    try {
      const res = await createAndPublishWazeefah(
        title,
        description,
        category,
        instructions,
        score,
        targetCount,
        reminderTime,
        quranRef
      );
      if (res.success) {
        setSuccess('Suggested Wazeefah published successfully!');
        // Reset form
        setTitle('');
        setCategory('');
        setDescription('');
        setInstructionsText('');
        setScore(90);
        setTargetCount(33);
        setReminderTime('Fajr');
        setShowQuranRef(false);
        setSurahSearch('');
        setSelectedSurah(null);
        setFromAyah('');
        setToAyah('');
        
        // Reload to update any server list
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(res.error || 'Failed to publish');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <h3 className="font-bold text-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <span>Create & Publish Wazeefah</span>
      </h3>

      {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded border border-rose-200 dark:border-rose-900/40">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-200 dark:border-emerald-900/40">{success}</p>}
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Title</label>
        <Input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required 
          placeholder="e.g. Wazeefah for Rizq after Fajr" 
          className="h-9 border-slate-350 dark:border-slate-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required 
            className="flex h-9 w-full rounded-md border border-slate-350 dark:border-slate-800 bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">Select Category</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authenticity Score (%)</label>
          <Input 
            type="number" 
            min={0} 
            max={100}
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value) || 0)}
            required 
            className="h-9 border-slate-350 dark:border-slate-800"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
        <Textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required 
          placeholder="Virtues and source..." 
          className="border-slate-350 dark:border-slate-800"
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex justify-between">
          <span>Instructions (One per line)</span>
        </label>
        <Textarea 
          value={instructionsText}
          onChange={(e) => setInstructionsText(e.target.value)}
          required 
          rows={3} 
          placeholder="1. Recite Durood 3 times&#10;2. Recite Ya Razzaqu 100 times&#10;3. Recite Durood 3 times" 
          className="border-slate-350 dark:border-slate-800"
        />
      </div>

      {/* Quran Reference Section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => { setShowQuranRef(v => !v); if (showQuranRef) { setSelectedSurah(null); setSurahSearch(''); setFromAyah(''); setToAyah(''); } }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-350 text-[10px] font-bold uppercase transition-colors cursor-pointer text-left"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            {selectedSurah ? `Surah ${selectedSurah.n}. ${selectedSurah.name}${fromAyah ? ` :${fromAyah}` : ''}${toAyah && toAyah !== fromAyah ? `–${toAyah}` : ''}` : 'Add Surah / Ayat (optional)'}
          </span>
          {showQuranRef ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showQuranRef && (
          <div className="border border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3 space-y-3">
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
                  <BookOpen className="w-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
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
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Count</label>
          <Input
            type="number"
            min={1}
            required
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g. 100"
            className="h-9 border-slate-350 dark:border-slate-800"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Reminder</label>
          <select
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full h-9 px-3 py-1.5 rounded-lg border border-slate-350 dark:border-slate-800 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

      <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-2 h-10">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
        Publish directly
      </Button>
    </form>
  );
}
