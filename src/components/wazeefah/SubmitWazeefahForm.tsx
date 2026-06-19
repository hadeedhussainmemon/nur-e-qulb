'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitWazeefah } from '@/app/actions/wazeefahActions';
import { Loader2 } from 'lucide-react';

const CATEGORIES = ['Rizq', 'Protection', 'Illness', 'Anxiety', 'Exams', 'Marriage', 'Forgiveness', 'Parents', 'Children'];

export function SubmitWazeefahForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
      
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input name="title" required placeholder="e.g. Wazeefah for Rizq after Fajr" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Category</label>
        <select name="category" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          <option value="">Select Category</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea name="description" required placeholder="Briefly explain what this wazeefah is for and its source/authenticity." />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Instructions (One per line)</label>
        <Textarea name="instructions" required rows={5} placeholder="1. Recite Durood 3 times&#10;2. Recite Ya Razzaqu 100 times&#10;3. Recite Durood 3 times" />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Submit for Approval
      </Button>
    </form>
  );
}
