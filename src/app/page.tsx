'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { PublicHome } from '@/components/home/PublicHome';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [city, setCity] = useState(() => (session?.user as any)?.location?.city || 'Makkah');
  const [country, setCountry] = useState(() => (session?.user as any)?.location?.country || 'Saudi Arabia');

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
