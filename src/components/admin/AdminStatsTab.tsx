'use client';

import React, { useState } from 'react';
import { Users, Network, BookOpen, Sparkles, Award, Globe, CalendarRange, Settings2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { updateCityHijriAdjustment, getPlatformStats } from '@/app/actions/adminActions';

export function AdminStatsTab({ stats, onUpdateStats }: { stats: any; onUpdateStats?: (stats: any) => void }) {
  const [selectedCity, setSelectedCity] = useState<{ city: string; country: string } | null>(null);
  const [newAdjustment, setNewAdjustment] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-350 dark:border-slate-800">
        Platform statistics currently unavailable.
      </div>
    );
  }

  const { totalUsers, totalFamilies, totalWazeefahs, totalCustomWazeefas, avgPrayerCompletion, featureUsage, cityAdjustments } = stats;

  const OVERVIEWS = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Family Groups', value: totalFamilies, icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Community Presets', value: totalWazeefahs, icon: BookOpen, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Custom User Adhkar', value: totalCustomWazeefas, icon: Sparkles, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  ];

  const handleUpdateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) return;
    setIsUpdating(true);
    try {
      const res = await updateCityHijriAdjustment(selectedCity.city, selectedCity.country, newAdjustment);
      if (res.success) {
        alert(`Successfully updated Hijri offset to ${newAdjustment > 0 ? '+' : ''}${newAdjustment} for ${res.modifiedCount} user(s) in ${selectedCity.city}.`);
        setSelectedCity(null);
        // Refresh the statistics
        const freshStats = await getPlatformStats();
        if (freshStats.success && onUpdateStats) {
          onUpdateStats(freshStats.stats);
        }
      } else {
        alert(res.error || 'Failed to update city adjustment.');
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEWS.map((o, idx) => {
          const Icon = o.icon;
          return (
            <Card key={idx} className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">{o.label}</span>
                <div className={`p-2 rounded-lg ${o.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{o.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Daily Prayer Performance */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-200">
              <Award className="w-5 h-5 text-amber-500" /> Prayer Completion Average
            </CardTitle>
            <CardDescription>Platform-wide completion average calculated from active user logs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-900 shadow-inner">
              {/* Simple CSS Circular indicator */}
              <div className="text-center">
                <span className="text-4xl font-black text-rose-600 dark:text-rose-400">{avgPrayerCompletion}%</span>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Completion</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-6 text-center max-w-sm">
              Reflects the average proportion of daily prayers marked as <strong>Completed</strong> vs Qaza or Missed across all submitted logs.
            </p>
          </CardContent>
        </Card>

        {/* Feature Usage statistics */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-200">
              <CalendarRange className="w-5 h-5 text-blue-500" /> Feature Popularity
            </CardTitle>
            <CardDescription>Metrics showing total logged activities per feature area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { name: 'Prayer Tracking', count: featureUsage.prayers, color: 'bg-rose-500' },
              { name: 'Hadith/Quran Bookmarks', count: featureUsage.quran, color: 'bg-emerald-500' },
              { name: 'Tasbih / Daily Adhkar', count: featureUsage.wazeefahs, color: 'bg-amber-500' },
              { name: 'Fasting Tracker logs', count: featureUsage.fasting, color: 'bg-indigo-500' },
            ].map((f, idx) => {
              const maxCount = Math.max(...Object.values(featureUsage) as number[], 1);
              const percentage = Math.round((f.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-355">
                    <span>{f.name}</span>
                    <span className="font-bold">{f.count} logs</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${f.color} rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* City-by-City Hijri adjustment Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-200">
            <Globe className="w-5 h-5 text-emerald-500" /> City Hijri Adjustments
          </CardTitle>
          <CardDescription>Overview of date corrections applied by users in different cities to match moon sightings.</CardDescription>
        </CardHeader>
        <CardContent>
          {!cityAdjustments || cityAdjustments.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">No adjustments recorded from users with active city settings.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-850">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                    <th className="p-3.5">City</th>
                    <th className="p-3.5">Country</th>
                    <th className="p-3.5 text-center">Islamic Date Correction</th>
                    <th className="p-3.5 text-center">Users Count</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {cityAdjustments.map((c: any, idx: number) => {
                    const adjustmentText = c.adjustment === 0 
                      ? '0 (No adjustment)' 
                      : c.adjustment > 0 
                        ? `+${c.adjustment} ${c.adjustment === 1 ? 'Day' : 'Days'}` 
                        : `${c.adjustment} ${c.adjustment === -1 ? 'Day' : 'Days'}`;
                    const adjustmentColor = c.adjustment === 0 
                      ? 'text-slate-500' 
                      : c.adjustment > 0 
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                        : 'text-rose-600 dark:text-rose-455 font-semibold';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{c.city}</td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400">{c.country || 'Saudi Arabia'}</td>
                        <td className={`p-3.5 text-center ${adjustmentColor}`}>{adjustmentText}</td>
                        <td className="p-3.5 text-center font-black text-slate-800 dark:text-slate-200">{c.count}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedCity({ city: c.city, country: c.country });
                              setNewAdjustment(c.adjustment);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-600 dark:text-slate-355 cursor-pointer transition-all duration-200"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>Fix Offset</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Modifying City Offset */}
      <Dialog open={selectedCity !== null} onOpenChange={(open) => { if (!open) setSelectedCity(null); }}>
        <DialogContent className="sm:max-w-[400px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 rounded-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-rose-500 animate-pulse" />
              Adjust Hijri Offset
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This updates the calendar correction offset for all users in this specific city.
            </DialogDescription>
          </DialogHeader>

          {selectedCity && (
            <form onSubmit={handleUpdateAdjustment} className="space-y-5 pt-3">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-250 dark:border-slate-800 space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Target Location</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{selectedCity.city}, {selectedCity.country || 'Saudi Arabia'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between">
                  <span>Islamic Date Correction</span>
                  <span className="font-black text-rose-500">
                    {newAdjustment === 0 
                      ? '0 (Standard)' 
                      : newAdjustment > 0 
                        ? `+${newAdjustment} Day${newAdjustment === 1 ? '' : 's'}` 
                        : `${newAdjustment} Day${newAdjustment === -1 ? '' : 's'}`}
                  </span>
                </label>
                <select
                  value={newAdjustment}
                  onChange={(e) => setNewAdjustment(parseInt(e.target.value, 10))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                >
                  <option value="-5">-5 Days</option>
                  <option value="-4">-4 Days</option>
                  <option value="-3">-3 Days</option>
                  <option value="-2">-2 Days</option>
                  <option value="-1">-1 Day</option>
                  <option value="0">0 (No adjustment)</option>
                  <option value="1">+1 Day</option>
                  <option value="2">+2 Days</option>
                  <option value="3">+3 Days</option>
                  <option value="4">+4 Days</option>
                  <option value="5">+5 Days</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCity(null)}
                  disabled={isUpdating}
                  className="h-9 px-4 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Apply Correction'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

