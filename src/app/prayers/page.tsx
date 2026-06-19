'use client';

import React, { useState, useEffect } from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PrayerHeatmap } from '@/components/prayers/PrayerHeatmap';
import { Clock, MapPin, AlertCircle, Flame, History, Check, ShieldCheck, Heart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/app/actions/authActions';
import { getTodayPrayerLog, togglePrayerStatus, getPrayerStreaks, getQazaPrayers, updateQazaPrayer, getPrayerHeatmapData } from '@/app/actions/prayerActions';
import { isPeriodActive } from '@/app/actions/periodActions';

export default function PrayerTrackerPage() {
  const [city, setCity] = useState('Makkah');
  const [country, setCountry] = useState('Saudi Arabia');
  const [loadingDb, setLoadingDb] = useState(true);

  // DB States
  const [todayLog, setTodayLog] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [fajrStreak, setFajrStreak] = useState(0);
  const [qazaPrayers, setQazaPrayers] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [gender, setGender] = useState('other');

  // Load Prayer Times Hook (updates automatically with interval)
  const { data: timesData, loading: timesLoading, error: timesError, nextPrayer, currentPrayer } = usePrayerTimes(city, country);

  const localDateStr = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD

  const loadDatabaseData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setGender(user.gender || 'other');
        if (user.location?.city) {
          setCity(user.location.city);
          setCountry(user.location.country || 'Saudi Arabia');
        }
      }

      const periodOn = await isPeriodActive();
      setIsCycleActive(periodOn);

      const log = await getTodayPrayerLog(localDateStr);
      setTodayLog(log);

      const streaks = await getPrayerStreaks(localDateStr);
      setCurrentStreak(streaks.currentStreak);
      setFajrStreak(streaks.fajrStreak);

      const qaza = await getQazaPrayers();
      setQazaPrayers(qaza);

      const heatmap = await getPrayerHeatmapData();
      setHeatmapData(heatmap);
    } catch (err) {
      console.error('Failed to load database details in prayer page', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handleTogglePrayer = async (prayerName: string, currentStatus: string) => {
    if (isCycleActive) return; // Excused prayers cannot be manually marked

    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Optimistic Update
    setTodayLog((prev: any) => {
      if (!prev) return null;
      const key = prayerName.toLowerCase();
      const updatedLog = { ...prev, [key]: newStatus };
      
      // Calculate temp percentage
      const list = [updatedLog.fajr, updatedLog.dhuhr, updatedLog.asr, updatedLog.maghrib, updatedLog.isha];
      const done = list.filter(p => p === 'completed' || p === 'excused').length;
      updatedLog.completionPercentage = Math.round((done / 5) * 100);
      
      return updatedLog;
    });

    const result = await togglePrayerStatus(localDateStr, prayerName, newStatus);
    if (result.success) {
      setTodayLog(result.log);
      // Reload streaks and heatmap to reflect changes
      const streaks = await getPrayerStreaks(localDateStr);
      setCurrentStreak(streaks.currentStreak);
      setFajrStreak(streaks.fajrStreak);
      const heatmap = await getPrayerHeatmapData();
      setHeatmapData(heatmap);
    } else {
      // Revert if error
      const log = await getTodayPrayerLog(localDateStr);
      setTodayLog(log);
    }
  };

  const handleAdjustQaza = async (prayerName: string, change: number) => {
    // Optimistic Update
    setQazaPrayers((prev: any) => {
      if (!prev) return null;
      const key = prayerName.toLowerCase();
      return {
        ...prev,
        [key]: Math.max(0, (prev[key] || 0) + change)
      };
    });

    const result = await updateQazaPrayer(prayerName, change);
    if (result.success) {
      setQazaPrayers(result.qaza);
    } else {
      // Revert if error
      const qaza = await getQazaPrayers();
      setQazaPrayers(qaza);
    }
  };

  const isLoading = timesLoading || loadingDb;

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Prayer Tracker</h2>
          <p className="text-muted-foreground mt-1 text-lg flex items-center flex-wrap gap-2">
            <MapPin className="w-4 h-4 text-emerald-500 inline shrink-0" /> {city}, {country}
            {timesData?.data?.date?.hijri && (
              <>
                <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {timesData.data.date.hijri.day} {timesData.data.date.hijri.month.en} {timesData.data.date.hijri.year} AH
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl border animate-pulse">
          <p className="text-muted-foreground text-sm">Syncing with database and prayer engines...</p>
        </div>
      ) : timesError ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{timesError}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xl">Today's Schedule</CardTitle>
              {nextPrayer && (
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 px-3 py-1 text-sm">
                  <Clock className="w-3 h-3 mr-2 inline" />
                  {nextPrayer.name} in {Math.floor(nextPrayer.diffMs / 3600000)}h {Math.floor((nextPrayer.diffMs % 3600000) / 60000)}m
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Period Mode Alert for Women */}
              {isCycleActive && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 rounded-xl flex gap-4 items-start">
                  <Heart className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-semibold text-sm">Cycle Excused Mode Active</h4>
                    <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mt-1">
                      You are currently excused from praying during your cycle. Rest well and stay spiritually engaged through Salawat, Dhikr, and Duas. Your streak calculations are safely frozen.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => {
                  const timings = timesData?.data?.timings;
                  let start = '--:--';
                  let end = '--:--';

                  if (timings) {
                    start = timings[name as keyof typeof timings] || '--:--';
                    if (name === 'Fajr') end = timings.Sunrise;
                    else if (name === 'Dhuhr') end = timings.Asr;
                    else if (name === 'Asr') end = timings.Maghrib || timings.Sunset;
                    else if (name === 'Maghrib') end = timings.Isha;
                    else if (name === 'Isha') end = timings.Fajr;
                  }

                  const isNext = nextPrayer?.name === name;
                  const isCurrent = currentPrayer === name;
                  
                  const key = name.toLowerCase();
                  const prayerStatus = todayLog ? todayLog[key] : 'pending';

                  const isDone = prayerStatus === 'completed';
                  const isExcused = prayerStatus === 'excused';

                  return (
                    <div 
                      key={name}
                      className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isExcused ? 'border-rose-200 bg-rose-500/5 dark:border-rose-950/30' :
                        isDone ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' :
                        isNext ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-500' : 
                        isCurrent ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/10' :
                        'border-slate-200 dark:border-slate-800 bg-card hover:border-emerald-400'
                      }`}
                    >
                      <span className={`font-semibold text-sm mb-2 ${
                        isExcused ? 'text-rose-500' :
                        isDone ? 'text-emerald-600 dark:text-emerald-400' :
                        isNext ? 'text-amber-700 dark:text-amber-500' : 
                        isCurrent ? 'text-emerald-700 dark:text-emerald-500' : ''
                      }`}>
                        {name}
                      </span>
                      
                      <div className="text-xs space-y-0.5 text-muted-foreground w-full mb-2">
                        <div className="flex justify-between px-1">
                          <span>Start:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{start}</span>
                        </div>
                        <div className="flex justify-between px-1">
                          <span>End:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{end}</span>
                        </div>
                      </div>
                      
                      {isExcused ? (
                        <span className="mt-auto w-full py-1.5 px-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> Excused
                        </span>
                      ) : isDone ? (
                        <Button
                          onClick={() => handleTogglePrayer(name, 'completed')}
                          variant="outline"
                          size="sm"
                          className="mt-auto w-full bg-emerald-500/10 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Completed
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleTogglePrayer(name, 'pending')}
                          variant="ghost"
                          size="sm"
                          className="mt-auto w-full border border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs"
                        >
                          Mark Done
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Streaks Sidebar */}
          <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-0 shadow-xl relative overflow-hidden">
            {/* Visual Sparkles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <CardHeader>
              <CardTitle className="text-emerald-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Prayer Streaks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
                  <Flame className="w-6 h-6 text-amber-300 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Fajr Streak</p>
                  <p className="text-3xl font-bold">{fajrStreak} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">All Prayers Streak</p>
                  <p className="text-3xl font-bold">{currentStreak} Days</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-emerald-500/20">
                <div className="flex justify-between text-xs mb-2 uppercase tracking-wider text-emerald-100">
                  <span>Today's Progress</span>
                  <span className="font-bold">{todayLog ? todayLog.completionPercentage : 0}%</span>
                </div>
                <Progress value={todayLog ? todayLog.completionPercentage : 0} className="h-2 bg-emerald-950/30 [&>div]:bg-amber-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap Section */}
      <PrayerHeatmap data={heatmapData} />

      {/* Qaza Tracker Section */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-rose-500" />
              <CardTitle className="text-lg">Qaza (Missed) Tracker</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">Auto-Sync Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Any prayer left uncompleted since you registered on this app is automatically enqueued as a Qaza. When you perform a make-up prayer, click the <strong className="text-rose-500 font-extrabold">-</strong> button to mark it completed!
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'].map((name) => {
              const key = name.toLowerCase();
              const count = qazaPrayers ? (qazaPrayers[key] || 0) : 0;

              return (
                <div key={name} className="flex flex-col items-center p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{name}</span>
                  <span className={`text-3xl font-bold mt-1 ${count > 0 ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    {count}
                  </span>
                  
                  <div className="flex gap-2 w-full mt-3">
                    <Button
                      onClick={() => handleAdjustQaza(name, -1)}
                      disabled={count === 0}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleAdjustQaza(name, 1)}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
