'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Check, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { PublicHome } from '@/components/home/PublicHome';
import { togglePrayerStatus, getPrayerStreaks } from '@/app/actions/prayerActions';

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

      {/* Interactive Prayers list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Today's Prayers</h3>
          {todayCompletion > 0 && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {todayCompletion}% Offered
            </span>
          )}
        </div>
        {timesLoading || loadingDb ? (
          <div className="h-20 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

              const isCurrent = currentPrayer === prayerName;
              const status = todayLog?.[prayerName.toLowerCase()] || 'pending';
              const isDone = status === 'completed' || status === 'excused';

              return (
                <Card key={prayerName} className={`transition-all duration-300 ${
                  isCurrent 
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <CardContent className="p-3 flex flex-col items-center justify-between text-center min-h-[110px]">
                    <div className="w-full">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="font-bold text-sm">{prayerName}</span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-around w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-1">
                        <span>{start}</span>
                        <span>-</span>
                        <span>{end}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleTogglePrayer(prayerName)}
                      className={`mt-2.5 w-full py-1 rounded-md text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        isDone 
                          ? 'bg-emerald-600 text-white border-transparent shadow hover:bg-emerald-700' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500'
                      }`}
                    >
                      {status === 'completed' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Offered</span>
                        </>
                      ) : status === 'excused' ? (
                        <span>Excused</span>
                      ) : (
                        <span>Mark Offered</span>
                      )}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
