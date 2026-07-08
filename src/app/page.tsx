'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Check, Loader2, CircleDot, ArrowRight, MoonStar, 
  BookOpen, Compass, Heart, Calendar, RotateCcw, BellOff 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { PublicHome } from '@/components/home/PublicHome';
import { togglePrayerStatus, getPrayerStreaks } from '@/app/actions/prayerActions';
import { logWazeefahProgress } from '@/app/actions/userWazeefahActions';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [city, setCity] = useState(() => (session?.user as any)?.location?.city || 'Makkah');
  const [country, setCountry] = useState(() => (session?.user as any)?.location?.country || 'Saudi Arabia');
  const [hijriAdjustment, setHijriAdjustment] = useState(() => (session?.user as any)?.hijriAdjustment || 0);
  const [loadingDb, setLoadingDb] = useState(true);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<string>('granted');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return;

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            console.warn('VAPID public key not found');
            return;
          }
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        const { savePushSubscription } = await import('@/app/actions/pushSubscriptionActions');
        await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      }
    } catch (err) {
      console.error('Failed to subscribe from user gesture:', err);
    }
  };

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


  // Fetch Hijri date based on local Gregorian date (NOT from prayer API location)
  useEffect(() => {
    async function fetchHijriDate() {
      try {
        const adjustedDate = new Date();
        adjustedDate.setDate(adjustedDate.getDate() + hijriAdjustment); // Shift the target date by the adjustment
        
        const dd = String(adjustedDate.getDate()).padStart(2, '0');
        const mm = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const yyyy = adjustedDate.getFullYear();
        
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`);
        if (res.ok) {
          const json = await res.json();
          const h = json?.data?.hijri;
          if (h) setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        }
      } catch {}
    }
    fetchHijriDate();
  }, [hijriAdjustment]);

  // Sync city/country if session loads later
  useEffect(() => {
    if (session?.user) {
      const loc = (session.user as any).location;
      if (loc?.city) {
        setCity(loc.city);
        setCountry(loc.country || 'Saudi Arabia');
      }
      const adj = (session.user as any).hijriAdjustment;
      if (typeof adj === 'number') {
        setHijriAdjustment(adj);
      }
    }
  }, [session]);

  const calculationMethod = (session?.user as any)?.settings?.prayerCalculationMethod || 'ISNA';
  const madhab = (session?.user as any)?.settings?.madhab || 'Hanafi';
  const { data: timesData, loading: timesLoading, nextPrayer, currentPrayer } = usePrayerTimes(city, country, calculationMethod, madhab);

  // Logical tracking date for prayers (doesn't change day until Fajr)
  const isPastMidnightBeforeFajr = nextPrayer?.name === 'Fajr' && new Date().getHours() < 12;
  const trackingDate = new Date();
  if (isPastMidnightBeforeFajr) {
    trackingDate.setDate(trackingDate.getDate() - 1);
  }
  const trackingDateString = trackingDate.toLocaleDateString('en-CA');

  // Fetch db stats for prayers using SWR for automatic client-side caching
  const { data: statsData, isLoading: statsLoading } = useSWR(
    status === 'authenticated' ? `/api/dashboard/stats?date=${trackingDateString}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  useEffect(() => {
    if (statsData) {
      if (statsData.streaks) {
        setPrayerStreak(statsData.streaks.currentStreak || 0);
        setFajrStreak(statsData.streaks.fajrStreak || 0);
      }
      if (statsData.prayerLog) {
        setTodayLog(statsData.prayerLog);
        setTodayCompletion(statsData.prayerLog.completionPercentage || 0);
      }
      setUserWazeefahs(statsData.userWazeefahs || []);
      setLoadingDb(false);
    }
  }, [statsData]);

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
      const result = await togglePrayerStatus(trackingDateString, prayerName, newStatus);
      if (result.success) {
        setTodayLog(result.log);
        setTodayCompletion(result.log.completionPercentage);
        
        const newStreaks = await getPrayerStreaks(trackingDateString);
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

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayCompletion / 100) * circumference;

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto px-1 md:px-4">
      {/* Notification Permission Alert Banner */}
      {notificationPermission !== 'granted' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <BellOff className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Notifications Not Enabled</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {notificationPermission === 'denied' ? (
                  <>Notifications are blocked on this browser/device. <strong>Solution:</strong> Click the settings/lock icon in your browser's address bar next to the URL, and change "Notifications" to "Allow" to receive reminders.</>
                ) : (
                  <>You haven't permitted notifications. Enable notifications to receive timely prayer reminders and wazeefah alerts.</>
                )}
              </p>
            </div>
          </div>
          {notificationPermission === 'default' && (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 border-0"
            >
              Enable Now
            </button>
          )}
        </div>
      )}

      {/* Top Welcome / Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            As-salamu alaykum, <span className="text-emerald-450">{username}!</span>
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs md:text-sm font-medium">
            {hijriStr} • {gregorianStr}
          </p>
        </div>
        
        {/* Next Prayer Floating Widget */}
        {timesLoading ? (
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 shrink-0 py-3 px-4 rounded-2xl min-w-[230px] h-[76px] animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2 w-12 bg-emerald-500/20 rounded" />
              <div className="h-4 w-20 bg-emerald-500/25 rounded" />
            </div>
          </div>
        ) : (
          <Card className="bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-foreground dark:text-white shadow-lg shadow-emerald-500/5 shrink-0 py-3 px-4 rounded-2xl min-w-[230px] transition-all hover:scale-[1.02] duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                    NEXT: {nextPrayer?.name || 'ASR'}
                  </p>
                  <p className="text-lg font-bold leading-none mt-1 font-mono">
                    {nextPrayer ? `${Math.floor(nextPrayer.diffMs / 3600000)}h ${Math.floor((nextPrayer.diffMs % 3600005) / 60000)}m` : '2h 50m'}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {nextPrayerTimeStr} • Insha'Allah
                  </p>
                </div>
              </div>
              
              {/* Circular Progress Ring */}
              <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    className="stroke-emerald-500/10 dark:stroke-emerald-500/5 fill-transparent"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    className="stroke-emerald-500 dark:stroke-emerald-400 fill-transparent transition-all duration-500 ease-out"
                    strokeWidth="3.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {todayCompletion}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Active Prayer Card */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase">Active Prayer</h3>
        {timesLoading || loadingDb ? (
          <div className="h-20 bg-muted animate-pulse rounded-xl" />
        ) : (
          <Card className="relative overflow-hidden border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 backdrop-blur-md shadow-md shadow-emerald-500/5 rounded-2xl transition-all hover:scale-[1.005] hover:shadow-lg hover:shadow-emerald-500/5 duration-300">
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

            <CardContent className="p-5 flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                {/* Clock / Pulse Icon wrapper */}
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-550 animate-pulse shadow-sm" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                    <span className="font-bold text-base text-foreground">{activePrayerName}</span>
                    <span className="text-xs font-bold text-emerald-550">
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
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95 duration-200 ${
                  isDone 
                    ? 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700' 
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
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
        <Card className="relative overflow-hidden border-purple-500/25 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 backdrop-blur-md shadow-md shadow-purple-500/5 rounded-2xl transition-all hover:scale-[1.005] hover:shadow-lg hover:shadow-purple-500/5 duration-300">
          <div className="p-4 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Tasbeeh Counter
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click the bead to count your dhikr</p>
            </div>
            <Link href="/tasbih" className="text-[10px] text-purple-650 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-medium">
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
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      i === tasbihIdx
                        ? 'bg-purple-600 text-white border-transparent shadow-sm'
                        : 'border-purple-500/20 bg-purple-500/5 text-purple-650 dark:text-purple-450 hover:bg-purple-500/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div 
                onClick={handleTasbihTap}
                className="flex items-center gap-5 bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/15 p-4 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-all select-none"
              >
                {/* Bead count circle (Solid purple matching layout) */}
                <div className={`relative w-16 h-16 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-650 text-white shrink-0 shadow-md transition-all duration-100 ${
                  tasbihPressed ? 'scale-95 ring-4 ring-purple-500/30' : 'hover:scale-105'
                }`}>
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
                  <p className="font-arabic text-xl font-bold text-foreground leading-tight">{TASBIH_ADHKARS[tasbihIdx].arabic}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Active Dhikr</p>
                  
                  <div className="flex flex-col mt-2">
                    <span className="text-lg font-bold font-mono text-purple-550 leading-none">{tasbihTotal}</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">Total Today</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Wazeefahs Card */}
        <Card className="relative overflow-hidden border-blue-500/25 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 backdrop-blur-md shadow-md shadow-blue-500/5 rounded-2xl transition-all hover:scale-[1.005] hover:shadow-lg hover:shadow-blue-500/5 duration-300">
          <div className="p-4 pb-2 flex flex-row items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Active Wazeefahs
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Your scheduled routines</p>
            </div>
            <Link href="/wazeefahs" className="text-[10px] text-blue-650 dark:text-blue-450 hover:underline flex items-center gap-0.5 font-medium">
              Manage <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[140px] text-center">
            {loadingDb ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            ) : userWazeefahs.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5">
                {/* Blue calendar icon graphic */}
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-450 shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-muted-foreground">No active scheduled wazeefahs.</p>
                <Link href="/wazeefahs">
                  <button className="border border-emerald-500 bg-transparent text-emerald-450 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/10 transition-colors cursor-pointer">
                    Create Routine
                  </button>
                </Link>
              </div>
            ) : (
              <div className="w-full space-y-2">
                {userWazeefahs.slice(0, 2).map((uw: any) => {
                  const todayCompletion = uw.completions.find((c: any) => c.date === trackingDateString);
                  const count = todayCompletion ? todayCompletion.count : 0;
                  const isCompleted = count >= uw.targetCount;

                  const handleCheckClick = async () => {
                    const newCount = isCompleted ? 0 : uw.targetCount;
                    const res = await logWazeefahProgress(uw._id, newCount, trackingDateString);
                    if (res.success) {
                      setUserWazeefahs(prev => prev.map((w: any) => w._id === uw._id ? res.userWazeefah : w));
                    }
                  };

                  return (
                    <div key={uw._id} className="flex justify-between items-center group py-2 px-3.5 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/10 hover:bg-blue-500/10 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={handleCheckClick}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-blue-500/30 bg-blue-500/5 text-blue-600 hover:border-emerald-500 hover:bg-emerald-500/10'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0 text-left">
                          <p className={`font-semibold text-xs text-foreground truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {uw.title}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {count}/{uw.targetCount} • {uw.reminderTime || 'Fajr'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-slate-800 ${isCompleted ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 'text-slate-400'}`}>
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
        <Card className="p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground mb-3">
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
                <div className={`p-2 rounded-xl bg-background border border-border ${act.color}`}>
                  <act.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{act.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Islamic Calendar Card */}
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Islamic Calendar
            </h3>
            <p className="text-base font-bold text-emerald-405 leading-none mt-1">{hijriStr}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">{gregorianStr}</p>
          </div>
          <div className="pt-4 flex justify-end">
            <Link href="/calendar">
              <button className="border border-border hover:border-foreground/20 bg-transparent text-muted-foreground hover:text-foreground px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors cursor-pointer">
                View Calendar
              </button>
            </Link>
          </div>
        </Card>

        {/* Daily Inspiration / Hadith Card Quote block */}
        <Card className="p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.04] pointer-events-none text-emerald-450">
            <svg className="h-full w-full" viewBox="0 0 100 60" fill="currentColor">
              <path d="M 40 60 L 40 30 Q 40 10 55 10 Q 70 10 70 30 L 70 60 Z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Daily Inspiration
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
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
