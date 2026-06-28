'use client';

import React, { useState } from 'react';
import { BookOpen, Sparkles, Award, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminWazeefahControls } from './AdminWazeefahControls';
import { promoteWazeefahToPreset } from '@/app/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = ['Rizq', 'Protection', 'Illness', 'Anxiety', 'Exams', 'Marriage', 'Forgiveness', 'Parents', 'Children'] as const;

export function AdminCustomWazeefasTab({
  initialPending,
  initialApproved,
  initialCustom,
  onUpdatePending,
  onUpdateApproved,
  onUpdateCustom,
}: {
  initialPending: any[];
  initialApproved: any[];
  initialCustom: any[];
  onUpdatePending: (list: any[]) => void;
  onUpdateApproved: (list: any[]) => void;
  onUpdateCustom: (list: any[]) => void;
}) {
  const [subTab, setSubTab] = useState<'pending' | 'presets' | 'personal'>('pending');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('Protection');
  const [loadingAction, setLoadingAction] = useState(false);

  // Edit Suggestion States
  const [editingWazeefah, setEditingWazeefah] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<typeof CATEGORIES[number]>('Protection');
  const [editInstructions, setEditInstructions] = useState('');
  const [editTarget, setEditTarget] = useState(33);
  const [editReminder, setEditReminder] = useState('Fajr');
  const [editReference, setEditReference] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditClick = (w: any) => {
    setEditingWazeefah(w);
    setEditTitle(w.title);
    setEditDesc(w.description);
    setEditCategory(w.category);
    setEditInstructions(w.instructions.join('\n'));
    setEditTarget(w.targetCount || 33);
    setEditReminder(w.reminderTime || 'Fajr');
    setEditReference(w.reference || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWazeefah) return;

    setIsUpdating(true);
    try {
      const { updatePendingWazeefah } = await import('@/app/actions/wazeefahActions');
      const res = await updatePendingWazeefah(editingWazeefah._id, {
        title: editTitle,
        description: editDesc,
        category: editCategory,
        instructions: editInstructions.split('\n').map(s => s.trim()).filter(Boolean),
        targetCount: editTarget,
        reminderTime: editReminder,
        reference: editReference || null,
      });

      if (res.success) {
        alert('Wazeefah successfully updated!');
        onUpdatePending(
          initialPending.map((p: any) =>
            p._id === editingWazeefah._id ? { ...p, ...res.wazeefah } : p
          )
        );
        onUpdateApproved(
          initialApproved.map((p: any) =>
            p._id === editingWazeefah._id ? { ...p, ...res.wazeefah } : p
          )
        );
        setEditingWazeefah(null);
      } else {
        alert(res.error || 'Failed to update wazeefah.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePresetDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this community preset suggested wazeefah?')) return;
    try {
      const { rejectWazeefah } = await import('@/app/actions/wazeefahActions');
      const res = await rejectWazeefah(id);
      if (res.success) {
        alert('Preset successfully deleted.');
        onUpdateApproved(initialApproved.filter((p: any) => p._id !== id));
      } else {
        alert(res.error || 'Failed to delete preset.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePromoteClick = (id: string) => {
    setPromotingId(id);
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingId) return;

    setLoadingAction(true);
    try {
      const res = await promoteWazeefahToPreset(promotingId, selectedCategory);
      if (res.success) {
        alert('Custom Adhkar successfully promoted and published to Community Explorer suggestions!');
        // Remove from the personal list locally
        onUpdateCustom(initialCustom.filter((c: any) => c._id !== promotingId));
        setPromotingId(null);
      } else {
        alert(res.error || 'Failed to promote.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Sub-tab Switcher */}
      <div className="flex gap-4 border-b dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('pending')}
          className={`pb-2 text-sm font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
            subTab === 'pending'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          Community Submissions ({initialPending.length})
        </button>
        <button
          onClick={() => setSubTab('presets')}
          className={`pb-2 text-sm font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
            subTab === 'presets'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          Suggested Wazeefas ({initialApproved.length})
        </button>
        <button
          onClick={() => setSubTab('personal')}
          className={`pb-2 text-sm font-bold tracking-wide uppercase transition-all border-b-2 cursor-pointer ${
            subTab === 'personal'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
          }`}
        >
          Personal Custom Adhkar ({initialCustom.length})
        </button>
      </div>

      {subTab === 'pending' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">Pending Approvals</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Review, grade, and approve wazeefahs submitted by community users.</p>

          {initialPending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-800">
              No pending submissions to review.
            </div>
          ) : (
            <div className="grid gap-6">
              {initialPending.map((w: any) => (
                <Card key={w._id} className="border-amber-200 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/5">
                  <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded mb-1.5 inline-block">
                          {w.category}
                        </span>
                        <CardTitle className="text-lg">{w.title}</CardTitle>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 text-right">
                        By {w.submittedBy?.name || 'Unknown'}<br />{new Date(w.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm bg-white dark:bg-slate-900/55 p-3 rounded border dark:border-slate-800">{w.description}</p>
                    
                    {/* Wazeefah Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Target Count</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.targetCount || 33} recitations</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Recommended Reminder</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.reminderTime || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Reference / Source</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block max-w-[150px]" title={w.reference || 'None'}>
                          {w.reference || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Quran Reference</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          {w.quranRef ? (
                            <>
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span>{w.quranRef.surahName} ({w.quranRef.surahNumber}:{w.quranRef.fromAyah || 1}{w.quranRef.toAyah ? `-${w.quranRef.toAyah}` : ''})</span>
                            </>
                          ) : (
                            'None'
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Instructions</h4>
                      <ul className="text-sm list-decimal list-inside space-y-1 bg-white dark:bg-slate-900/30 p-3 rounded border dark:border-slate-800">
                        {w.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                      </ul>
                    </div>
                    
                    <AdminWazeefahControls wazeefahId={w._id} onEdit={() => handleEditClick(w)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : subTab === 'presets' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">Suggested Wazeefas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage community-wide preset template wazeefas.</p>

          {initialApproved.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-800">
              No approved presets available.
            </div>
          ) : (
            <div className="grid gap-6">
              {initialApproved.map((w: any) => (
                <Card key={w._id} className="border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/5">
                  <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded mb-1.5 inline-block">
                          {w.category}
                        </span>
                        <CardTitle className="text-lg">{w.title}</CardTitle>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-muted-foreground block">
                          By {w.submittedBy?.name || 'Admin'}
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-450 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">
                          {w.authenticityScore}% Authentic
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm bg-white dark:bg-slate-900/55 p-3 rounded border dark:border-slate-800">{w.description}</p>
                    
                    {/* Wazeefah Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Target Count</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.targetCount || 33} recitations</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Recommended Reminder</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.reminderTime || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Reference / Source</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block max-w-[150px]" title={w.reference || 'None'}>
                          {w.reference || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Quran Reference</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          {w.quranRef ? (
                            <>
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span>{w.quranRef.surahName} ({w.quranRef.surahNumber}:{w.quranRef.fromAyah || 1}{w.quranRef.toAyah ? `-${w.quranRef.toAyah}` : ''})</span>
                            </>
                          ) : (
                            'None'
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Instructions</h4>
                      <ul className="text-sm list-decimal list-inside space-y-1 bg-white dark:bg-slate-900/30 p-3 rounded border dark:border-slate-800">
                        {w.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                      </ul>
                    </div>
                    
                    <div className="flex justify-end gap-2 border-t pt-3 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(w)} className="text-blue-600 hover:text-blue-750">
                        Edit Preset
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePresetDelete(w._id)} className="text-rose-600 hover:text-rose-700">
                        Delete Preset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">Personal Custom Adhkar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Observe custom wazeefas users created for themselves, and promote them to community explore recommendations.</p>

          {initialCustom.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-800">
              No user-created custom wazeefas available.
            </div>
          ) : (
            <div className="grid gap-6">
              {initialCustom.map((c: any) => (
                <Card key={c._id} className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/10 dark:bg-indigo-950/5">
                  <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span>{c.title}</span>
                        </CardTitle>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 text-right">
                        Created By {c.userId?.name || 'Unknown'}<br />{new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {c.description && (
                      <p className="text-sm bg-white dark:bg-slate-900/55 p-3 rounded border dark:border-slate-800">{c.description}</p>
                    )}
                    
                    {/* Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Target Count</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.targetCount || 33} recitations</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Reminder Schedule</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.reminderTime || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Quran Reference</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          {c.quranRef ? (
                            <>
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span>{c.quranRef.surahName} ({c.quranRef.surahNumber}:{c.quranRef.fromAyah || 1}{c.quranRef.toAyah ? `-${c.quranRef.toAyah}` : ''})</span>
                            </>
                          ) : (
                            'None'
                          )}
                        </span>
                      </div>
                    </div>

                    {c.instructions && c.instructions.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Instructions</h4>
                        <ul className="text-sm list-decimal list-inside space-y-1 bg-white dark:bg-slate-900/30 p-3 rounded border dark:border-slate-800">
                          {c.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      {promotingId === c._id ? (
                        <form onSubmit={handlePromoteSubmit} className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border dark:border-slate-800 w-full md:w-auto">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Category:</label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as any)}
                            required
                            className="bg-background border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-emerald-500 focus:outline-none"
                          >
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <Button type="submit" disabled={loadingAction} className="bg-emerald-650 text-white font-semibold text-xs px-3 h-8 hover:bg-emerald-700 shrink-0">
                            {loadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Promotion'}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setPromotingId(null)} className="h-8 text-xs cursor-pointer shrink-0">
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <Button
                          onClick={() => handlePromoteClick(c._id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer h-9 px-4 rounded-lg"
                        >
                          <Award className="w-4 h-4" />
                          <span>Promote to Preset Suggestions</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog for Admin Editing Suggested Wazeefas */}
      <Dialog open={!!editingWazeefah} onOpenChange={(open) => { if (!open) setEditingWazeefah(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              Edit Suggested Wazeefah
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Title</label>
              <Input
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Description</label>
              <Textarea
                required
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as any)}
                className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reference / Source</label>
              <Input
                value={editReference}
                onChange={(e) => setEditReference(e.target.value)}
                placeholder="Reference info..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex items-center justify-between">
                <span>Method / Instructions</span>
                <span className="text-[10px] text-muted-foreground font-normal">One step per line</span>
              </label>
              <Textarea
                required
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Target Count</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={editTarget}
                  onChange={(e) => setEditTarget(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder Schedule</label>
                <select
                  value={editReminder}
                  onChange={(e) => setEditReminder(e.target.value)}
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

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingWazeefah(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
