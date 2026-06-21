'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Check, Loader2, CircleDot, ArrowRight, MoonStar, 
  BookOpen, Compass, Heart, Calendar, RotateCcw 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { PublicHome } from '@/components/home/PublicHome';
import { togglePrayerStatus, getPrayerStreaks } from '@/app/actions/prayerActions';
import { logWazeefahProgress } from '@/app/actions/userWazeefahActions';
import Link from 'next/link';

// Helper to convert 24-hour format (HH:MM) to 12-hour format (h:mm AM/PM)
function formatTime12(timeStr: string): string {
  if (!timeStr || timeStr === '--:--') return '--:--';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
  
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  if (isNaN(hours)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [city, setCity] = useState(() => (session?.user as any)?.location?.city || 'Makkah');
  const [country, setCountry] = useState(() => (session?.user as any)?.location?.country || 'Saudi Arabia');
  const [loadingDb, setLoadingDb] = useState(true);
  const [hijriDate, setHijriDate] = useState<string>('');

  // Stats from DB
  const [prayerStreak, setPrayerStreak] = useState(0);
  const [fajrStreak, setFajrStreak] = useState(0);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [todayCompletion, setTodayCompletion] = useState(0);
  const [userWazeefahs, setUserWazeefahs] = useState<any[]>([]);

  // Tasbih Widget State
  const TASBIH_ADHKARS = [
    { id: 'subhanallah',   arabic: 'سُبْحَانَ اللَّه',  label: 'Subhan Allah',  target: 33  },
    { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّه', label: 'Al-Hamdu Lillah', target: 33  },
    { id: 'allahuakbar',   arabic: 'اللَّهُ أَكْبَر',   label: 'Allahu Akbar',   target: 34  },
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

  const handleResetTasbih = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setTasbihCount(0);
  }, []);

  const localTodayDateString = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD

  // Fetch Hijri date based on local Gregorian date (NOT from prayer API location)
  useEffect(() => {
    async function fetchHijriDate() {
      try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`);
        if (res.ok) {
          const json = await res.json();
          const h = json?.data?.hijri;
          if (h) setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        }
      } catch {}
    }
    fetchHijriDate();
  }, []);

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
        const response = await fetch(`/api/dashboard/stats?date=${localTodayDateString}`, { credentials: 'include' });
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
          setUserWazeefahs(data.userWazeefahs || []);
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
    : 'Dhuhr'; // fallback

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

  // Hijri date fetched from local Gregorian date (region-accurate)
  const hijriStr = hijriDate || (timesData
    ? `${timesData.data.date.hijri.day} ${timesData.data.date.hijri.month.en} ${timesData.data.date.hijri.year}`
    : '');
  
  const gregorianStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const nextPrayerTimeStr = timesData && nextPrayer 
    ? formatTime12(timesData.data.timings[nextPrayer.name as keyof typeof timesData.data.timings])
    : '1:54 PM';

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto px-1 md:px-4">
      {/* Top Welcome / Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            As-salamu alaykum, <span className="text-emerald-450">{username}!</span>
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs md:text-sm font-medium">
            {hijriStr} • {gregorianStr}
          </p>
        </div>
        
        {/* Next Prayer Floating Widget */}
        <Card className="bg-emerald-950/45 border border-emerald-500/20 text-white shadow-lg shadow-emerald-500/5 shrink-0 py-2.5 px-4 rounded-xl min-w-[200px]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/15 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                NEXT: {nextPrayer?.name || 'ASR'}
              </p>
              <p className="text-lg font-bold leading-tight mt-0.5 font-mono">
                {nextPrayer ? `${Math.floor(nextPrayer.diffMs / 3600000)}h ${Math.floor((nextPrayer.diffMs % 3600000) / 60000)}m` : '2h 50m'}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {nextPrayerTimeStr} • Insha'Allah
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Prayer Card */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase">Active Prayer</h3>
        {timesLoading || loadingDb ? (
          <div className="h-20 bg-slate-900/50 border border-slate-800 animate-pulse rounded-xl" />
        ) : (
          <Card className="relative overflow-hidden border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/10 shadow-sm ring-1 ring-emerald-500/20 rounded-xl">
            {/* Mosque Silhouette SVG Background */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.08] pointer-events-none text-emerald-450 flex justify-end items-end p-1">
              <svg className="h-full w-full max-w-[200px]" viewBox="0 0 100 60" fill="currentColor">
                <path d="M 10 60 L 10 20 Q 10 15 15 15 Q 20 15 20 20 L 20 60 Z" />
                <path d="M 40 60 L 40 30 Q 40 10 55 10 Q 70 10 70 30 L 70 60 Z" />
                <path d="M 22 60 L 22 40 Q 22 35 27 35 Q 32 35 32 40 L 32 60 Z" />
                <circle cx="55" cy="5" r="1.5" />
                <path d="M 54.5 3 L 55.5 3 M 55 2.5 L 55 3.5" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>

            <CardContent className="p-4 flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                {/* Clock / Pulse Icon wrapper */}
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                    <span className="font-bold text-base text-white">{activePrayerName}</span>
                    <span className="text-xs font-semibold text-emerald-405">
                      {formatTime12(start)} - {formatTime12(end)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Current active prayer time window
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleTogglePrayer(activePrayerName)}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isDone 
                    ? 'bg-emerald-600 text-white border-transparent shadow hover:bg-emerald-700' 
                    : 'border-emerald-500/40 bg-emerald-500/5 text-emerald-405 hover:bg-emerald-500/15'
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

      {/* Grid: Tasbeeh Counter & Active Wazeefahs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasbeeh Counter Card */}
        <Card className="border-slate-800 bg-slate-900/20 rounded-xl">
          <div className="p-4 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Tasbeeh Counter
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click the bead to count your dhikr</p>
            </div>
            <Link href="/tasbih" className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 font-medium">
              Full Counter <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          
          <CardContent className="p-4 pt-1">
            <div className="flex flex-col gap-4">
              {/* Adhkar selector chips */}
              <div className="flex gap-2 flex-wrap">
                {TASBIH_ADHKARS.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => { setTasbihIdx(i); setTasbihCount(0); }}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                      i === tasbihIdx
                        ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-sm'
                        : 'border-slate-800 text-muted-foreground hover:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div 
                onClick={handleTasbihTap}
                className="flex items-center gap-5 bg-slate-900/40 border border-slate-800 p-4 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors select-none"
              >
                {/* Bead count circle (Solid purple matching layout) */}
                <div className="relative w-16 h-16 rounded-full flex flex-col items-center justify-center bg-purple-600 text-white shrink-0 shadow-md hover:scale-105 transition-transform">
                  {/* Reset button inside circle top */}
                  <button 
                    onClick={handleResetTasbih}
                    className="absolute top-1 p-0.5 rounded-full hover:bg-white/20 text-white/80 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xl font-bold font-mono leading-none mt-2">{tasbihCount}</span>
                  <span className="text-[8px] opacity-80 mt-0.5">/{TASBIH_ADHKARS[tasbihIdx].target}</span>
                </div>

                {/* Stats */}
                <div className="flex-1 min-w-0">
                  <p className="font-arabic text-lg text-white leading-tight">{TASBIH_ADHKARS[tasbihIdx].arabic}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Active Dhikr</p>
                  
                  <div className="flex flex-col mt-2">
                    <span className="text-lg font-bold font-mono text-purple-400 leading-none">{tasbihTotal}</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">Total Today</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Wazeefahs Card */}
        <Card className="border-slate-800 bg-slate-900/20 rounded-xl">
          <div className="p-4 pb-2 flex flex-row items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Active Wazeefahs
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Your scheduled routines</p>
            </div>
            <Link href="/wazeefahs" className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 font-medium">
              Manage <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[140px] text-center">
            {loadingDb ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            ) : userWazeefahs.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5">
                {/* Blue calendar icon graphic */}
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-muted-foreground">No active scheduled wazeefahs.</p>
                <Link href="/wazeefahs">
                  <button className="border border-emerald-500 bg-transparent text-emerald-400 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/10 transition-colors cursor-pointer">
                    Create Routine
                  </button>
                </Link>
              </div>
            ) : (
              <div className="w-full space-y-2">
                {userWazeefahs.slice(0, 2).map((uw: any) => {
                  const todayCompletion = uw.completions.find((c: any) => c.date === localTodayDateString);
                  const count = todayCompletion ? todayCompletion.count : 0;
                  const isCompleted = count >= uw.targetCount;

                  const handleCheckClick = async () => {
                    const newCount = isCompleted ? 0 : uw.targetCount;
                    const res = await logWazeefahProgress(uw._id, newCount, localTodayDateString);
                    if (res.success) {
                      setUserWazeefahs(prev => prev.map((w: any) => w._id === uw._id ? res.userWazeefah : w));
                    }
                  };

                  return (
                    <div key={uw._id} className="flex justify-between items-center group py-1.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={handleCheckClick}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-650 hover:border-emerald-500'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0 text-left">
                          <p className={`font-semibold text-xs text-white truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {uw.title}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {count}/{uw.targetCount} • {uw.reminderTime || 'Fajr'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-slate-800 ${isCompleted ? 'border-emerald-500/20 text-emerald-600' : 'text-slate-400'}`}>
                        {isCompleted ? 'Done' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Quick Access & Islamic Calendar & Daily Inspiration */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Access Card */}
        <Card className="border-slate-800 bg-slate-900/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-white mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Quick Access
          </h3>
          <div className="flex justify-around items-center pt-2">
            {[
              { label: 'Quran', icon: BookOpen, href: '/quran', color: 'text-emerald-400 hover:text-emerald-350' },
              { label: 'Namaz', icon: Clock, href: '/prayers', color: 'text-teal-400 hover:text-teal-350' },
              { label: 'Qibla', icon: Compass, href: '/qibla', color: 'text-amber-500 hover:text-amber-350' },
              { label: 'Tasbeeh', icon: Heart, href: '/tasbih', color: 'text-purple-400 hover:text-purple-350' },
              { label: 'Calendar', icon: Calendar, href: '/calendar', color: 'text-cyan-400 hover:text-cyan-350' }
            ].map((act) => (
              <Link href={act.href} key={act.label} className="flex flex-col items-center gap-1 hover:opacity-85 transition-opacity">
                <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${act.color}`}>
                  <act.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{act.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Islamic Calendar Card */}
        <Card className="border-slate-800 bg-slate-900/20 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-white mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Islamic Calendar
            </h3>
            <p className="text-base font-bold text-emerald-405 leading-none mt-1">{hijriStr}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">{gregorianStr}</p>
          </div>
          <div className="pt-4 flex justify-end">
            <Link href="/calendar">
              <button className="border border-slate-800 hover:border-slate-700 bg-transparent text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800/50 transition-colors cursor-pointer">
                View Calendar
              </button>
            </Link>
          </div>
        </Card>

        {/* Daily Inspiration / Hadith Card Quote block */}
        <Card className="border-slate-800 bg-slate-900/20 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.04] pointer-events-none text-emerald-450">
            <svg className="h-full w-full" viewBox="0 0 100 60" fill="currentColor">
              <path d="M 40 60 L 40 30 Q 40 10 55 10 Q 70 10 70 30 L 70 60 Z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-white mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Daily Inspiration
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed italic">
              "And seek help through patience and prayer. And indeed, it is difficult except for the humble."
            </p>
          </div>
          <p className="text-[10px] text-emerald-400 font-semibold text-right mt-2 relative z-10">
            — Quran 2:45
          </p>
        </Card>
      </div>
    </div>
  );
}
