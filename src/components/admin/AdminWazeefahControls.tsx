'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { approveWazeefah, rejectWazeefah } from '@/app/actions/wazeefahActions';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function AdminWazeefahControls({ wazeefahId }: { wazeefahId: string }) {
  const [score, setScore] = useState('80');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    await approveWazeefah(wazeefahId, parseInt(score, 10));
    setIsLoading(false);
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject and delete this submission?')) return;
    setIsLoading(true);
    await rejectWazeefah(wazeefahId);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-between border-t border-amber-100 dark:border-amber-900/50 pt-4 mt-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-amber-800 dark:text-amber-300">Authenticity Score:</label>
        <Input 
          type="number" 
          value={score} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScore(e.target.value)} 
          className="w-20 h-8" 
          min="0" 
          max="100" 
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleReject} disabled={isLoading} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
          <XCircle className="w-4 h-4 mr-2" /> Reject
        </Button>
        <Button onClick={handleApprove} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} 
          Approve & Publish
        </Button>
      </div>
    </div>
  );
}
