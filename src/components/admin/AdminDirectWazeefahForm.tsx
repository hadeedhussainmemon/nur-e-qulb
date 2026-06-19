'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createAndPublishWazeefah } from '@/app/actions/wazeefahActions';
import { Loader2, Plus, Sparkles } from 'lucide-react';

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

    try {
      const res = await createAndPublishWazeefah(title, description, category, instructions, score);
      if (res.success) {
        setSuccess('Suggested Wazeefah published successfully!');
        // Reset form
        setTitle('');
        setCategory('');
        setDescription('');
        setInstructionsText('');
        setScore(90);
        
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

      {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-100 dark:border-rose-900/40">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-100 dark:border-emerald-900/40">{success}</p>}
      
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
        <Input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required 
          placeholder="e.g. Wazeefah for Rizq after Fajr" 
          className="h-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required 
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">Select Category</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Authenticity Score (%)</label>
          <Input 
            type="number" 
            min={0} 
            max={100}
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value) || 0)}
            required 
            className="h-9"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
        <Textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required 
          placeholder="Virtues and source..." 
          rows={2}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex justify-between">
          <span>Instructions (One per line)</span>
          <span className="text-[10px] text-slate-400 font-normal lowercase">Enter steps</span>
        </label>
        <Textarea 
          value={instructionsText}
          onChange={(e) => setInstructionsText(e.target.value)}
          required 
          rows={4} 
          placeholder="1. Recite Durood 3 times&#10;2. Recite Ya Razzaqu 100 times&#10;3. Recite Durood 3 times" 
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
        Publish directly
      </Button>
    </form>
  );
}
