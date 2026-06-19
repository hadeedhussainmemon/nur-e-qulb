'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Plus,
  ListChecks,
  Clock,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { SubmitWazeefahForm } from './SubmitWazeefahForm';
import {
  subscribeToWazeefah,
  createCustomWazeefah,
  logWazeefahProgress,
  deleteUserWazeefah
} from '@/app/actions/userWazeefahActions';

export function WazeefahPageClient({
  initialWazeefahs,
  initialUserWazeefahs
}: {
  initialWazeefahs: any[];
  initialUserWazeefahs: any[];
}) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'explore'>('schedule');
  const [wazeefahs, setWazeefahs] = useState(initialWazeefahs);
  const [userWazeefahs, setUserWazeefahs] = useState(initialUserWazeefahs);

  // Modals/Forms State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Subscription Details
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [subTargetCount, setSubTargetCount] = useState<number>(33);
  const [subReminderTime, setSubReminderTime] = useState<string>('Fajr');

  // Custom Wazeefah Details
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customInstructionsText, setCustomInstructionsText] = useState('');
  const [customTarget, setCustomTarget] = useState<number>(33);
  const [customReminder, setCustomReminder] = useState('Fajr');

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const localTodayDateString = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time

  const handleCommunitySubmitSuccess = () => {
    setIsSubmitOpen(false);
    alert('Wazeefah submitted successfully! It will appear under the community tab once approved by an admin.');
  };

  const handleOpenSubscribe = (wazeefah: any) => {
    setSelectedTemplate(wazeefah);
    setSubTargetCount(wazeefah.targetCount || 33);
    setIsSubscribeOpen(true);
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setLoadingActionId('subscribe');
    try {
      const res = await subscribeToWazeefah(selectedTemplate._id, subTargetCount, subReminderTime);
      if (res.success) {
        setUserWazeefahs([res.userWazeefah, ...userWazeefahs]);
        setIsSubscribeOpen(false);
        setActiveTab('schedule');
      } else {
        alert(res.error || 'Failed to add Wazeefah.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle) return;

    setLoadingActionId('custom');
    const instructions = customInstructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      const res = await createCustomWazeefah(customTitle, customDesc, instructions, customTarget, customReminder);
      if (res.success) {
        setUserWazeefahs([res.userWazeefah, ...userWazeefahs]);
        setIsCustomOpen(false);
        // Reset form
        setCustomTitle('');
        setCustomDesc('');
        setCustomInstructionsText('');
        setCustomTarget(33);
        setCustomReminder('Fajr');
        setActiveTab('schedule');
      } else {
        alert(res.error || 'Failed to create wazeefah.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleIncrement = async (userWazeefah: any, amount: number) => {
    const actionId = `inc-${userWazeefah._id}`;
    setLoadingActionId(actionId);
    try {
      const todayCompletion = userWazeefah.completions.find((c: any) => c.date === localTodayDateString);
      const currentCount = todayCompletion ? todayCompletion.count : 0;
      const newCount = currentCount + amount;

      const res = await logWazeefahProgress(userWazeefah._id, newCount, localTodayDateString);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === userWazeefah._id ? res.userWazeefah : w)));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleResetCount = async (userWazeefah: any) => {
    const actionId = `reset-${userWazeefah._id}`;
    setLoadingActionId(actionId);
    try {
      const res = await logWazeefahProgress(userWazeefah._id, 0, localTodayDateString);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === userWazeefah._id ? res.userWazeefah : w)));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCompleteDirectly = async (userWazeefah: any) => {
    const actionId = `complete-${userWazeefah._id}`;
    setLoadingActionId(actionId);
    try {
      const res = await logWazeefahProgress(userWazeefah._id, userWazeefah.targetCount, localTodayDateString);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === userWazeefah._id ? res.userWazeefah : w)));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeleteSchedule = async (userWazeefahId: string) => {
    if (!window.confirm('Are you sure you want to remove this Wazeefah from your schedule?')) return;

    const actionId = `delete-${userWazeefahId}`;
    setLoadingActionId(actionId);
    try {
      const res = await deleteUserWazeefah(userWazeefahId);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.filter((w) => w._id !== userWazeefahId));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs Controller */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          My Schedule ({userWazeefahs.length})
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'explore'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Explore Community ({wazeefahs.length})
        </button>
      </div>

      {/* Top Banner Action Bar */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          {activeTab === 'schedule'
            ? 'Track your daily personal adhkar and wazeefahs.'
            : 'All community wazeefahs are reviewed for authenticity.'}
        </p>
        <div className="flex gap-2">
          {activeTab === 'schedule' ? (
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsCustomOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Custom
            </Button>
          ) : (
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsSubmitOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Submit Wazeefah
            </Button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'schedule' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userWazeefahs.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl space-y-4">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No Wazeefahs Scheduled</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Add custom Wazeefahs or browse community presets to build your daily spiritual schedule.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('explore')}>
                  Browse Presets
                </Button>
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsCustomOpen(true)}>
                  Create Custom
                </Button>
              </div>
            </div>
          ) : (
            userWazeefahs.map((uw: any) => {
              const todayCompletion = uw.completions.find((c: any) => c.date === localTodayDateString);
              const count = todayCompletion ? todayCompletion.count : 0;
              const isCompleted = count >= uw.targetCount;
              const pct = Math.min(100, Math.round((count / uw.targetCount) * 100));

              return (
                <Card key={uw._id} className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden">
                  {isCompleted && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rotate-45 translate-x-10 -translate-y-10 flex items-end justify-center pb-2 select-none pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
                    </div>
                  )}

                  <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400">
                        {uw.isCustom ? 'Custom' : 'Preset'}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-semibold">{uw.reminderTime || 'Fajr'}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-snug line-clamp-1">{uw.title}</CardTitle>
                    {uw.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{uw.description}</p>}
                  </CardHeader>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-5">
                    {/* Progress details */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Daily Progress</span>
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                          {count} <span className="text-muted-foreground font-normal text-xs">/ {uw.targetCount}</span>
                        </span>
                      </div>
                      <Progress value={pct} className={`h-2 [&>div]:transition-all ${isCompleted ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-600'}`} />
                    </div>

                    {/* Instructions List (small preview) */}
                    {uw.instructions && uw.instructions.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5 text-blue-500" /> Method
                        </p>
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          {uw.instructions.slice(0, 2).map((inst: string, idx: number) => (
                            <li key={idx} className="flex gap-1.5 items-start">
                              <span className="font-semibold text-blue-500 select-none">{idx + 1}.</span>
                              <span className="line-clamp-1">{inst}</span>
                            </li>
                          ))}
                          {uw.instructions.length > 2 && (
                            <li className="text-[10px] text-muted-foreground italic pl-3">+ {uw.instructions.length - 2} more steps</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Progress Control Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 border-slate-100 dark:border-slate-850">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          disabled={loadingActionId !== null}
                          onClick={() => handleIncrement(uw, 1)}
                        >
                          +1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          disabled={loadingActionId !== null}
                          onClick={() => handleIncrement(uw, 10)}
                        >
                          +10
                        </Button>
                        {count > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-slate-800"
                            disabled={loadingActionId !== null}
                            onClick={() => handleResetCount(uw)}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isCompleted ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                            disabled={loadingActionId !== null}
                            onClick={() => handleCompleteDirectly(uw)}
                          >
                            Complete
                          </Button>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 rounded-full"
                          disabled={loadingActionId !== null}
                          onClick={() => handleDeleteSchedule(uw._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wazeefahs.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              No approved community presets yet. Be the first to submit!
            </div>
          ) : (
            wazeefahs.map((w: any) => (
              <Card key={w._id} className="flex flex-col justify-between border-blue-100 dark:border-blue-900">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/50 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md">
                      {w.category}
                    </span>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/40">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-xs font-bold">{w.authenticityScore}% Authentic</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl leading-snug">{w.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{w.description}</p>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <ListChecks className="w-4 h-4 text-blue-500" /> Instructions
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        {w.instructions.map((inst: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-5 h-5 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 text-xs sm:text-sm">{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Added: {new Date(w.createdAt).toLocaleDateString()}</span>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenSubscribe(w)}>
                      Add to Schedule <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Dialog for Custom Submission Form */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit to Community</DialogTitle>
          </DialogHeader>
          <SubmitWazeefahForm onSuccess={handleCommunitySubmitSuccess} />
        </DialogContent>
      </Dialog>

      {/* Dialog to Subscribe to Community Presets */}
      <Dialog open={isSubscribeOpen} onOpenChange={setIsSubscribeOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" /> Add to Daily Routine
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubscribeSubmit} className="space-y-4 pt-2">
            {selectedTemplate && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedTemplate.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Daily Target Count</label>
              <Input
                type="number"
                min={1}
                required
                value={subTargetCount}
                onChange={(e) => setSubTargetCount(parseInt(e.target.value, 10))}
                placeholder="e.g. 33 or 100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder / Schedule</label>
              <select
                value={subReminderTime}
                onChange={(e) => setSubReminderTime(e.target.value)}
                className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSubscribeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loadingActionId !== null}>
                {loadingActionId === 'subscribe' ? 'Scheduling...' : 'Add to Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Custom Wazeefah Routine Setup */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" /> Setup Custom Adhkar
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustomSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Wazeefah / Adhkar Title</label>
              <Input
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Istighfar 100x"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Description (Optional)</label>
              <Textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="What is the virtue of this adhkar or details on recitation..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex items-center justify-between">
                <span>Method / Instructions</span>
                <span className="text-[10px] text-muted-foreground font-normal">One step per line</span>
              </label>
              <Textarea
                value={customInstructionsText}
                onChange={(e) => setCustomInstructionsText(e.target.value)}
                placeholder="Step 1: Recite Astaghfirullah&#10;Step 2: Contemplate forgiveness..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Target Count</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={customTarget}
                  onChange={(e) => setCustomTarget(parseInt(e.target.value, 10))}
                  placeholder="e.g. 100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder Schedule</label>
                <select
                  value={customReminder}
                  onChange={(e) => setCustomReminder(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCustomOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loadingActionId !== null}>
                {loadingActionId === 'custom' ? 'Creating...' : 'Create Wazeefah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
