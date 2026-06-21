'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Calendar, Compass, Heart, MoonStar, Target, Clock, 
  Loader2, ArrowRight, ShieldCheck, Award, Lock, CircleDot, 
  Users, Sparkles, Plus, Check, Star 
} from 'lucide-react';
import Link from 'next/link';

import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { DailyAyahWidget } from '@/components/quran/DailyAyahWidget';
import { DailyHadithWidget } from '@/components/hadith/DailyHadithWidget';
import { useSession } from 'next-auth/react';
import { logWazeefahProgress, subscribeToWazeefah, getUserWazeefahs } from '@/app/actions/userWazeefahActions';
import { togglePrayerStatus, getPrayerStreaks, getTodayPrayerLog } from '@/app/actions/prayerActions';
import { getLastRead } from '@/app/actions/lastReadActions';
import { getFastingSummary } from '@/app/actions/fastingActions';
import { getQuranBookmarks } from '@/app/actions/bookmarkActions';
import { getQuranProgress } from '@/app/actions/quranProgressActions';
import { getFamilyDetails } from '@/app/actions/familyActions';
import { getApprovedWazeefahs } from '@/app/actions/wazeefahActions';

import { PublicHome } from '@/components/home/PublicHome';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [city, setCity] = useState(() => (session?.user as any)?.location?.city || 'Makkah');
  const [country, setCountry] = useState(() => (session?.user as any)?.location?.country || 'Saudi Arabia');
  const [loadingDb, setLoadingDb] = useState(true);

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

  // Stats from DB
  const [prayerStreak, setPrayerStreak] = useState(0);
  const [fajrStreak, setFajrStreak] = useState(0);
  const [todayCompletion, setTodayCompletion] = useState(0);
  const [todayLog, setTodayLog] = useState<any>(null);
  
  // Family & Suggestions
  const [family, setFamily] = useState<any>(null);
  const [suggestedWazeefah, setSuggestedWazeefah] = useState<any>(null);
  const [addingWazeefah, setAddingWazeefah] = useState(false);

  // Custom checkpoints & achievements
  const [lastRead, setLastRead] = useState<any>(null);
  const [totalFasts, setTotalFasts] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [quranProgress, setQuranProgress] = useState<any>(null);
  const [userWazeefahs, setUserWazeefahs] = useState<any[]>([]);

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

  // Hook handles countdown timer internally
  const { data: timesData, loading: timesLoading, nextPrayer, currentPrayer } = usePrayerTimes(city, country);

  useEffect(() => {
    async function loadStats() {
      try {
        // Run sequentially on the client to avoid concurrent server request locks
        const streaks = await getPrayerStreaks(localTodayDateString).catch(() => ({ currentStreak: 0, fajrStreak: 0 }));
        if (streaks) {
          setPrayerStreak(streaks.currentStreak || 0);
          setFajrStreak(streaks.fajrStreak || 0);
        }

        const log = await getTodayPrayerLog(localTodayDateString).catch(() => null);
        if (log) {
          setTodayLog(log);
          setTodayCompletion(log.completionPercentage || 0);
        }

        const readData = await getLastRead().catch(() => null);
        setLastRead(readData);

        const fastingData = await getFastingSummary().catch(() => ({ totalFasts: 0 }));
        if (fastingData) {
          setTotalFasts(fastingData.totalFasts || 0);
        }

        const bookmarks = await getQuranBookmarks().catch(() => []);
        setBookmarksCount(bookmarks ? bookmarks.length : 0);

        const progress = await getQuranProgress().catch(() => null);
        setQuranProgress(progress);

        const wazeefahs = await getUserWazeefahs().catch(() => []);
        setUserWazeefahs(wazeefahs || []);

        const familyData = await getFamilyDetails().catch(() => null);
        setFamily(familyData);

        const approvedWazeefahs = await getApprovedWazeefahs().catch(() => []);
        if (approvedWazeefahs && approvedWazeefahs.length > 0) {
          const userWazeefahIds = wazeefahs?.map((uw: any) => uw.wazeefahId) || [];
          const unsubscribed = approvedWazeefahs.filter((w: any) => !userWazeefahIds.includes(w._id));
          const pool = unsubscribed.length > 0 ? unsubscribed : approvedWazeefahs;
          const randomWaz = pool[Math.floor(Math.random() * pool.length)];
          setSuggestedWazeefah(randomWaz);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats from DB', err);
      } finally {
        setLoadingDb(false);
      }
    }

    if (status === 'authenticated') {
      loadStats();
    }
  }, [status]);

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

  const handleAddSuggestedWazeefah = async () => {
    if (!suggestedWazeefah || addingWazeefah) return;
    setAddingWazeefah(true);
    try {
      const res = await subscribeToWazeefah(suggestedWazeefah._id, 33, '09:00');
      if (res.success) {
        setUserWazeefahs((prev) => [res.userWazeefah, ...prev]);
        setSuggestedWazeefah(null); // Clear suggestion after adding
      } else {
        alert(res.error || 'Failed to add Wazeefah');
      }
    } catch (e: any) {
      alert(e.message || 'Error subscribing to Wazeefah');
    } finally {
      setAddingWazeefah(false);
    }
  };

  if (loadingDb) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Welcome to Nur E Qalbb. Initializing dashboard...</p>
      </div>
    );
  }

  const username = session?.user?.name || 'User';

  // Gamification Badges calculation
  const badgesList = [
    {
      id: 'fajr_streak',
      title: 'Fajr Guardian',
      desc: 'Achieve a 7-day Fajr prayer streak',
      unlocked: fajrStreak >= 7,
      metric: `${fajrStreak}/7 days`,
      color: 'from-amber-400 to-orange-500 text-amber-950',
    },
    {
      id: 'fasting_devotee',
      title: 'Fasting Devotee',
      desc: 'Complete 5 fasts this year',
      unlocked: totalFasts >= 5,
      metric: `${totalFasts}/5 fasts`,
      color: 'from-emerald-400 to-teal-500 text-emerald-950',
    },
    {
      id: 'knowledge_seeker',
      title: 'Knowledge Seeker',
      desc: 'Save at least 2 Quran bookmarks',
      unlocked: bookmarksCount >= 2,
      metric: `${bookmarksCount}/2 saved`,
      color: 'from-blue-400 to-indigo-500 text-blue-950',
    },
    {
      id: 'tasbih_master',
      title: 'Tasbih Master',
      desc: 'Achieve an active prayer streak',
      unlocked: prayerStreak >= 3,
      metric: `${prayerStreak}/3 days`,
      color: 'from-purple-400 to-pink-500 text-purple-950',
    }
  ];

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            As-salamu alaykum, {username}!
          </h2>
          <p className="text-muted-foreground mt-1 text-lg font-medium">
            {timesData ? `${timesData.data.date.hijri.day} ${timesData.data.date.hijri.month.en} ${timesData.data.date.hijri.year}` : 'Loading Hijri Date...'} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg shrink-0">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-55">Next Prayer: {nextPrayer?.name || 'Loading...'}</p>
              <p className="text-2xl font-bold">
                {nextPrayer ? `${Math.floor(nextPrayer.diffMs / 3600000)}h ${Math.floor((nextPrayer.diffMs % 3600000) / 60000)}m` : '--:--'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Reading Widget Banner */}
      {lastRead && (
        <Link href={`/quran/${lastRead.surahNumber}#ayah-${lastRead.ayahNumber}`}>
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/10 cursor-pointer shadow-md group transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <BookOpen className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Last Read Checkpoint</p>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-0.5">
                    Surah {lastRead.surahNumber} (Ayah {lastRead.ayahNumber})
                  </h4>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Interactive Prayers list */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Today's Prayers</h3>
        {timesLoading ? (
          <div className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayerName) => {
              const timings = timesData?.data?.timings;
              let start = '--:--';
              let end = '--:--';

              if (timings) {
                start = timings[prayerName as keyof typeof timings] || '--:--';
                if (prayerName === 'Fajr') end = timings.Sunrise;
                else if (prayerName === 'Dhuhr') end = timings.Asr;
                else if (prayerName === 'Asr') end = timings.Maghrib || timings.Sunset;
                else if (prayerName === 'Maghrib') end = timings.Isha;
                else if (prayerName === 'Isha') end = timings.Fajr;
              }

              const isNext = nextPrayer?.name === prayerName;
              const isCurrent = currentPrayer === prayerName;
              const status = todayLog?.[prayerName.toLowerCase()] || 'pending';
              const isDone = status === 'completed' || status === 'excused';

              return (
                <Card key={prayerName} className={`border-l-4 ${
                  isCurrent ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10' :
                  isNext ? 'border-l-amber-500 ring-1 ring-amber-500' :
                  'border-l-slate-300 dark:border-l-slate-700'
                }`}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <span className="font-semibold text-base mb-2">{prayerName}</span>
                    <div className="text-xs space-y-0.5 text-muted-foreground w-full">
                      <div className="flex justify-between px-1">
                        <span>Start:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{start}</span>
                      </div>
                      <div className="flex justify-between px-1">
                        <span>End:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{end}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleTogglePrayer(prayerName)}
                      className={`mt-4 w-full py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                        isDone 
                          ? 'bg-emerald-600 text-white border-transparent shadow hover:bg-emerald-700' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500'
                      }`}
                    >
                      {status === 'completed' && <Check className="w-3.5 h-3.5" />}
                      {status === 'completed' ? 'Completed' : status === 'excused' ? 'Excused' : 'Mark Done'}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quran Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {quranProgress ? (
              <>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {quranProgress.overallPercentage}% Completed
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {quranProgress.juzProgress.filter((j: any) => j.completed).length} of 30 Juz • {quranProgress.khatmCount} Khatms
                </p>
                <Progress value={quranProgress.overallPercentage} className="h-2 [&>div]:bg-emerald-500" />
                {quranProgress.targetDate && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    Target completion: {new Date(quranProgress.targetDate).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : lastRead ? (
              <>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">Surah {lastRead.surahNumber}</div>
                <p className="text-xs text-muted-foreground mb-4">Ayah {lastRead.ayahNumber}</p>
                <Progress value={Math.round((lastRead.surahNumber / 114) * 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {Math.round((lastRead.surahNumber / 114) * 100)}% Completed
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">Not Started</div>
                <p className="text-xs text-muted-foreground mb-4">Read to begin tracking</p>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-right">0% Completed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Goals</CardTitle>
            <Target className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Prayer Completion</span>
                <span className="font-medium text-emerald-600">{todayCompletion}%</span>
              </div>
              <Progress value={todayCompletion} className="h-1.5 animate-pulse" />
              
              <div className="flex justify-between items-center text-sm">
                <span>Prayer Streak</span>
                <span className="font-medium text-emerald-600">{prayerStreak} Days</span>
              </div>
              <Progress value={Math.min(100, (prayerStreak / 30) * 100)} className="h-1.5 [&>div]:bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Wazeefah & Adhkar Routines */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wazeefahs</CardTitle>
            <MoonStar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userWazeefahs.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground space-y-2">
                  <p>No active scheduled wazeefahs.</p>
                  <Link href="/wazeefahs" className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Create Routine
                  </Link>
                </div>
              ) : (
                userWazeefahs.slice(0, 3).map((uw: any) => {
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
                    <div key={uw._id} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={handleCheckClick}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {uw.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {count}/{uw.targetCount} • {uw.reminderTime || 'Fajr'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={isCompleted ? 'border-emerald-500/20 text-emerald-600' : ''}>
                        {isCompleted ? 'Done' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })
              )}
              {userWazeefahs.length > 3 && (
                <div className="text-center pt-2">
                  <Link href="/wazeefahs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    View all ({userWazeefahs.length})
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Wazeefah & Family Circle Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wazeefah Suggestion Widget */}
        <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Suggested Wazeefah
              </CardTitle>
            </div>
            <CardDescription>Expand your daily Adhkar routines</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col justify-between h-[120px]">
            {suggestedWazeefah ? (
              <>
                <div>
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">{suggestedWazeefah.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestedWazeefah.description}</p>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800/60 pt-2">
                  <span className="text-muted-foreground">Target: {suggestedWazeefah.targetCount || 33} times</span>
                  <Button 
                    onClick={handleAddSuggestedWazeefah} 
                    disabled={addingWazeefah}
                    size="sm"
                    className="bg-indigo-650 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-bold text-xs h-7 rounded-lg shrink-0 px-3 flex items-center gap-1 shadow-none"
                  >
                    {addingWazeefah ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Add to Routine
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground italic">
                All suggested Wazeefahs are already added to your routine!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Analytics Widget */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Family Circle
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">{family ? family.name : 'Grow spiritually with family'}</CardDescription>
            </div>
            {family && (
              <Link href="/family" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Manage Circle
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            {family ? (
              <div className="space-y-3 max-h-[120px] overflow-y-auto pr-1">
                {family.members.map((member: any) => {
                  const todayComp = member.analytics?.todayCompletion ?? 0;
                  const weekCount = member.analytics?.weekCompleted ?? 0;
                  return (
                    <div key={member._id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate w-32">{member.name}</span>
                        <span className="text-muted-foreground text-[10px]">
                          Today: {todayComp}% | 7d: {weekCount} prayers
                        </span>
                      </div>
                      <Progress value={todayComp} className="h-1.5 [&>div]:bg-indigo-500 bg-indigo-100 dark:bg-indigo-950/20" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground space-y-2">
                <p>Not in a family circle yet.</p>
                <Link href="/family" className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:underline">
                  Join/Create Circle
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Achievements (Badge System) */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-emerald-500" /> Gamified Badges & Achievements
          </CardTitle>
          <CardDescription>Strengthen your discipline and unlock visual honor badges.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {badgesList.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border flex flex-col justify-between h-36 transition-all ${
                  badge.unlocked
                    ? `bg-gradient-to-br ${badge.color} border-transparent shadow-lg scale-100 hover:scale-[1.02]`
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-900 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base leading-snug">{badge.title}</h4>
                    {badge.unlocked ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-950 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs mt-1 leading-normal ${badge.unlocked ? 'text-slate-950/80' : 'text-muted-foreground'}`}>
                    {badge.desc}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-black/5 dark:border-white/5 pt-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Progress</span>
                  <span className="text-xs font-bold font-mono">{badge.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasbeeh Mini Widget */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDot className="w-5 h-5 text-purple-500" /> Tasbeeh Counter
            </CardTitle>
            <Link href="/tasbih" className="text-xs text-primary hover:underline flex items-center gap-1">
              Full Counter <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <CardDescription>Click the bead to count your dhikr</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Adhkar selector chips */}
            <div className="flex gap-2 flex-wrap">
              {TASBIH_ADHKARS.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => { setTasbihIdx(i); setTasbihCount(0); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    i === tasbihIdx
                      ? 'bg-primary text-primary-foreground border-transparent shadow'
                      : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-primary'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Bead tap button */}
            <button
              onPointerDown={handleTasbihTap}
              className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center
                bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-xl
                transition-all duration-100 shrink-0
                ${tasbihPressed ? 'scale-90 shadow-md' : 'scale-100 hover:scale-105'}`}
              aria-label="Tap bead"
            >
              <CircleDot className="w-5 h-5 opacity-60 mb-0.5" />
              <span className="text-3xl font-bold font-mono leading-none">{tasbihCount}</span>
              <span className="text-[10px] opacity-60">/{TASBIH_ADHKARS[tasbihIdx].target}</span>
            </button>

            {/* Stats */}
            <div className="flex gap-4 text-center">
              <div>
                <p className="font-arabic text-2xl leading-relaxed">{TASBIH_ADHKARS[tasbihIdx].arabic}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Dhikr</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-violet-500">{tasbihTotal}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Today</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <DailyAyahWidget />
        <DailyHadithWidget />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Read Quran', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', href: '/quran' },
            { label: 'Qibla Finder', icon: Compass, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', href: '/qibla' },
            { label: 'Dhikr Counter', icon: Heart, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', href: '/dua' },
            { label: 'My Wazeefahs', icon: Calendar, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', href: '/wazeefahs' },
          ].map((action) => (
            <Link href={action.href} key={action.label}>
              <Card className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-2xl ${action.color}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
