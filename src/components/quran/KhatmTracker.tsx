'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle2, Flame, Award, BookOpen, Clock, RefreshCw } from 'lucide-react';

interface KhatmTrackerProps {
  progress: {
    juzProgress: { juzNumber: number; completed: boolean }[];
    khatmCount: number;
    overallPercentage: number;
    targetDate?: string;
    startDate?: string;
  } | null;
  onToggleJuz: (juzNumber: number, completed: boolean) => Promise<void>;
  onIncrementKhatm: () => Promise<void>;
  onSetTargetDate: (targetDateStr: string | null) => Promise<void>;
}

export function KhatmTracker({
  progress,
  onToggleJuz,
  onIncrementKhatm,
  onSetTargetDate,
}: KhatmTrackerProps) {
  const [targetDateInput, setTargetDateInput] = useState<string>(
    progress?.targetDate ? new Date(progress.targetDate).toISOString().split('T')[0] : ''
  );
  const [updatingJuz, setUpdatingJuz] = useState<number | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);
  const [completingKhatm, setCompletingKhatm] = useState(false);

  if (!progress) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading completion tracker...
      </div>
    );
  }

  const completedJuzCount = progress.juzProgress.filter((j) => j.completed).length;

  // Khatm Planner calculations
  let daysRemaining = 0;
  let pagesPerDay = 0;
  let juzPerDay = 0;

  if (progress.targetDate) {
    const tDate = new Date(progress.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tDate.setHours(0, 0, 0, 0);

    const diffTime = tDate.getTime() - today.getTime();
    daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const remainingJuz = 30 - completedJuzCount;
    const remainingPages = remainingJuz * 20; // 20 pages per Juz (standard)

    if (remainingJuz > 0) {
      pagesPerDay = Math.ceil(remainingPages / daysRemaining);
      juzPerDay = parseFloat((remainingJuz / daysRemaining).toFixed(2));
    }
  }

  const handleToggleJuzClick = async (juzNumber: number, currentlyCompleted: boolean) => {
    setUpdatingJuz(juzNumber);
    try {
      await onToggleJuz(juzNumber, !currentlyCompleted);
    } finally {
      setUpdatingJuz(null);
    }
  };

  const handleSetTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      await onSetTargetDate(targetDateInput || null);
    } finally {
      setSavingTarget(false);
    }
  };

  const handleClearTarget = async () => {
    setTargetDateInput('');
    setSavingTarget(true);
    try {
      await onSetTargetDate(null);
    } finally {
      setSavingTarget(false);
    }
  };

  const handleCompleteKhatmClick = async () => {
    if (!window.confirm('MashaAllah! Are you sure you have completed the full Quran? This will increment your Khatm count and reset Juz progress for the next Khatm.')) {
      return;
    }
    setCompletingKhatm(true);
    try {
      await onIncrementKhatm();
      setTargetDateInput('');
    } finally {
      setCompletingKhatm(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 dark:border-emerald-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Quran Progress</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{progress.overallPercentage}% Completed</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <Progress value={progress.overallPercentage} className="h-2.5 bg-slate-200 dark:bg-slate-800 [&>div]:bg-emerald-500" />
            <p className="text-sm text-muted-foreground">{completedJuzCount} of 30 Juz Completed</p>
          </CardContent>
        </Card>

        {/* Khatm Count Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 dark:border-amber-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Khatm Tracker</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{progress.khatmCount} Khatms</h3>
              </div>
              <div className="w-10 h-10 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 animate-bounce" />
              </div>
            </div>
            <Button
              onClick={handleCompleteKhatmClick}
              disabled={completingKhatm || completedJuzCount < 30}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-sm disabled:opacity-50"
            >
              {completedJuzCount < 30 ? 'Complete all Juz to log Khatm' : 'Log Completed Khatm! 🎉'}
            </Button>
          </CardContent>
        </Card>

        {/* Daily Target Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20 dark:border-blue-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Daily Reading Target</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {progress.targetDate ? `${pagesPerDay} Pages` : 'No Target Set'}
                </h3>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            {progress.targetDate ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Read ~{juzPerDay} Juz daily to finish in {daysRemaining} days.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Set a target completion date below.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Target Date Form & Planner */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" /> Khatm Completion Planner
          </CardTitle>
          <CardDescription>Plan when you wish to complete the full Quran and compute required reading speeds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetTarget} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-semibold text-muted-foreground">Target Completion Date</label>
              <input
                type="date"
                value={targetDateInput}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setTargetDateInput(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <Button type="submit" disabled={savingTarget || !targetDateInput} className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white">
                {savingTarget ? 'Saving...' : 'Set Target'}
              </Button>
              {progress.targetDate && (
                <Button type="button" variant="outline" onClick={handleClearTarget} disabled={savingTarget}>
                  Clear
                </Button>
              )}
            </div>
          </form>

          {progress.targetDate && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-semibold mt-0.5">{new Date(progress.startDate!).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target Date</p>
                <p className="text-sm font-semibold mt-0.5">{new Date(progress.targetDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining Days</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{daysRemaining} Days</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target Rate</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{pagesPerDay} Pages/day</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Juz Completion Grid */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" /> Mark Completed Juz
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {progress.juzProgress.map((juz) => {
            const isUpdating = updatingJuz === juz.juzNumber;
            return (
              <div
                key={juz.juzNumber}
                onClick={() => !isUpdating && handleToggleJuzClick(juz.juzNumber, juz.completed)}
                className={`p-3.5 rounded-xl border flex flex-col justify-between h-20 cursor-pointer select-none transition-all duration-200 relative overflow-hidden group ${
                  juz.completed
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/5 scale-100 hover:scale-[1.02]'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Juz {juz.juzNumber}</span>
                  <div className="pointer-events-none">
                    <input
                      type="checkbox"
                      checked={juz.completed}
                      readOnly
                      disabled={isUpdating}
                      className="rounded border-slate-300 dark:border-slate-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4 accent-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-semibold">{juz.completed ? 'Completed' : 'Pending'}</span>
                  {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin opacity-50 shrink-0 mb-0.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
