'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Check, Loader2, CircleDot, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { PublicHome } from '@/components/home/PublicHome';
import { togglePrayerStatus, getPrayerStreaks } from '@/app/actions/prayerActions';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [city, setCity] = useState(() => (session?.user as any)?.location?.city || 'Makkah');
  const [country, setCountry] = useState(() => (session?.user as any)?.location?.country || 'Saudi Arabia');
  const [loadingDb, setLoadingDb] = useState(true);

  // Stats from DB
  const [prayerStreak, setPrayerStreak] = useState(0);
  const [fajrStreak, setFajrStreak] = useState(0);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [todayCompletion, setTodayCompletion] = useState(0);

  // Tasbih Widget State
  const TASBIH_ADHKARS = [
    { id: 'subhanallah',   arabic: 'سُبْحَانَ اللَّه',  label: 'Subhān Allāh',  target: 33  },
    { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّه', label: 'Al-Ḥamdu Lillāh', target: 33  },
    { id: 'allahuakbar',   arabic: 'اللَّهُ أَكْبَر',   label: 'Allāhu Akbar',   target: 34  },
  ];
  const [tasbihIdx, setTasbihIdx] = useState(0);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTotal, setTasbihTotal] = useState(0);
  const [tasbihPressed, setTasbihPressed] = useState(false);
  const tasbihAudioRef = useRef<AudioContext | null>(null);

  const playTasbihClick = useCallback(() => {
    try {
      if (!tasbihAudioRef.current || tasbihAudioRef.current.state === 'closed') {
        tasbihAudioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = tasbihAudioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, []);

  const handleTasbihTap = useCallback(() => {
    setTasbihPressed(true);
    setTimeout(() => setTasbihPressed(false), 120);
    playTasbihClick();
    const target = TASBIH_ADHKARS[tasbihIdx].target;
    setTasbihCount((prev) => {
      if (prev + 1 >= target) {
        setTasbihTotal((t) => t + target);
        return 0;
      }
      setTasbihTotal((t) => t + 1);
      return prev + 1;
    });
  }, [tasbihIdx, playTasbihClick]);

  const localTodayDateString = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD

  // Sync city/country if session loads later
  useEffect(() => {
    if (session?.user) {
      const loc = (session.user as any).location;
      if (loc?.city) {
        setCity(loc.city);
        setCountry(loc.country || 'Saudi Arabia');
      }
    }
  }, [session]);

  const { data: timesData, loading: timesLoading, nextPrayer, currentPrayer } = usePrayerTimes(city, country);

  // Fetch db stats for prayers
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(`/api/dashboard/stats?date=${localTodayDateString}`);
        if (response.ok) {
          const data = await response.json();
          if (data.streaks) {
            setPrayerStreak(data.streaks.currentStreak || 0);
            setFajrStreak(data.streaks.fajrStreak || 0);
          }
          if (data.prayerLog) {
            setTodayLog(data.prayerLog);
            setTodayCompletion(data.prayerLog.completionPercentage || 0);
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingDb(false);
      }
    }
    loadStats();
  }, [localTodayDateString]);

  const handleTogglePrayer = async (prayerName: string) => {
    const currentStatus = todayLog?.[prayerName.toLowerCase()] || 'pending';
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    // Optimistic Update
    setTodayLog((prev: any) => {
      if (!prev) return null;
      const updatedLog = { ...prev, [prayerName.toLowerCase()]: newStatus };
      const list = [updatedLog.fajr, updatedLog.dhuhr, updatedLog.asr, updatedLog.maghrib, updatedLog.isha];
      const done = list.filter(p => p === 'completed' || p === 'excused').length;
      setTodayCompletion(Math.round((done / 5) * 100));
      return updatedLog;
    });

    try {
      const result = await togglePrayerStatus(localTodayDateString, prayerName, newStatus);
      if (result.success) {
        setTodayLog(result.log);
        setTodayCompletion(result.log.completionPercentage);
        
        const newStreaks = await getPrayerStreaks(localTodayDateString);
        setPrayerStreak(newStreaks.currentStreak || 0);
        setFajrStreak(newStreaks.fajrStreak || 0);
      }
    } catch (error) {
      console.error('Error toggling prayer:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <PublicHome />;
  }

  const username = session?.user?.name || 'User';

  // Get timings details for the active current prayer
  const activePrayerName = currentPrayer && ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(currentPrayer) 
    ? currentPrayer 
    : 'Fajr'; // fallback

  const timings = timesData?.data?.timings;
  let start = '--:--';
  let end = '--:--';

  if (timings) {
    start = timings[activePrayerName as keyof typeof timings] || '--:--';
    if (activePrayerName === 'Fajr') end = timings.Sunrise;
    else if (activePrayerName === 'Dhuhr') end = timings.Asr;
    else if (activePrayerName === 'Asr') end = timings.Maghrib || timings.Sunset;
    else if (activePrayerName === 'Maghrib') end = timings.Isha;
    else if (activePrayerName === 'Isha') end = timings.Fajr;
  }

  const statusVal = todayLog?.[activePrayerName.toLowerCase()] || 'pending';
  const isDone = statusVal === 'completed' || statusVal === 'excused';

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            As-salamu alaykum, {username}!
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm font-medium">
            {timesData ? `${timesData.data.date.hijri.day} ${timesData.data.date.hijri.month.en} ${timesData.data.date.hijri.year}` : 'Loading Hijri Date...'} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-md shrink-0 py-2 px-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-emerald-100" />
            <div>
              <p className="text-[10px] font-medium text-emerald-100 uppercase tracking-wider">Next: {nextPrayer?.name || 'Loading...'}</p>
              <p className="text-lg font-bold leading-none mt-0.5">
                {nextPrayer ? `${Math.floor(nextPrayer.diffMs / 3600000)}h ${Math.floor((nextPrayer.diffMs % 3600000) / 60000)}m` : '--:--'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Active Prayer Focus Widget */}
      <div>
        <h3 className="text-base font-semibold mb-3">Active Prayer</h3>
        {timesLoading || loadingDb ? (
          <div className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl" />
        ) : (
          <Card className="max-w-md border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{activePrayerName}</span>
                    <span className="text-xs text-muted-foreground">({start} - {end})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current active prayer time window
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleTogglePrayer(activePrayerName)}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                  isDone 
                    ? 'bg-emerald-600 text-white border-transparent shadow hover:bg-emerald-700' 
                    : 'border-emerald-500/30 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10'
                }`}
              >
                {statusVal === 'completed' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Offered</span>
                  </>
                ) : statusVal === 'excused' ? (
                  <span>Excused</span>
                ) : (
                  <span>Mark Offered</span>
                )}
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tasbeeh Mini Widget */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CircleDot className="w-4 h-4 text-purple-500" /> Tasbeeh Counter
            </CardTitle>
            <Link href="/tasbih" className="text-xs text-primary hover:underline flex items-center gap-1">
              Full Counter <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <CardDescription className="text-xs">Click the bead to count your dhikr</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Adhkar selector chips */}
            <div className="flex gap-2 flex-wrap">
              {TASBIH_ADHKARS.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => { setTasbihIdx(i); setTasbihCount(0); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    i === tasbihIdx
                      ? 'bg-purple-600 text-white border-transparent shadow'
                      : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-purple-500'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Bead tap button */}
            <button
              onPointerDown={handleTasbihTap}
              className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center
                bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg
                transition-all duration-100 shrink-0
                ${tasbihPressed ? 'scale-95 shadow-sm' : 'scale-100 hover:scale-105'}`}
              aria-label="Tap bead"
            >
              <CircleDot className="w-4 h-4 opacity-60 mb-0.5" />
              <span className="text-2xl font-bold font-mono leading-none">{tasbihCount}</span>
              <span className="text-[9px] opacity-60">/{TASBIH_ADHKARS[tasbihIdx].target}</span>
            </button>

            {/* Stats */}
            <div className="flex gap-4 text-center">
              <div>
                <p className="font-arabic text-xl leading-relaxed">{TASBIH_ADHKARS[tasbihIdx].arabic}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Active Dhikr</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-purple-600">{tasbihTotal}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total Today</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
