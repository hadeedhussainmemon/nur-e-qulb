'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { fetchPrayerTimesByCity } from '@/app/actions/prayerActions';

// Mock calculation for demo purposes.
// In reality, we would use an Islamic Calendar API or library (like hijri-converter or moment-hijri)
// to get the exact Hijri date.
const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

export default function CalendarPage() {
  const { data: session } = useSession();
  const [daysToHajj, setDaysToHajj] = useState(0);
  const [daysToRamadan, setDaysToRamadan] = useState(0);
  const [hijriDateString, setHijriDateString] = useState("Loading Hijri Date..."); // Dynamic date
  
  const [locationStr, setLocationStr] = useState(() => {
    if (session?.user) {
      const loc = (session.user as any).location;
      if (loc?.city) {
        return `${loc.city}, ${loc.country || 'Saudi Arabia'}`;
      }
    }
    return "Makkah, Saudi Arabia";
  });

  useEffect(() => {
    if (session?.user) {
      const loc = (session.user as any).location;
      if (loc?.city) {
        setLocationStr(`${loc.city}, ${loc.country || 'Saudi Arabia'}`);
      }
    }
  }, [session]);

  useEffect(() => {
    async function loadIslamicDate() {
      try {
        const city = (session?.user as any)?.location?.city || 'Makkah';
        const country = (session?.user as any)?.location?.country || 'Saudi Arabia';
        
        const times = await fetchPrayerTimesByCity(city, country);
        if (times?.data?.date?.hijri) {
          const h = times.data.date.hijri;
          setHijriDateString(`${h.day} ${h.month.en} ${h.year} AH`);
        } else {
          setHijriDateString("Hijri Date unavailable");
        }
      } catch (err) {
        console.error('Failed to load Hijri Date:', err);
        setHijriDateString("Hijri Date unavailable");
      }
    }

    loadIslamicDate();

    // Next Ramadan (Approx Feb 8, 2027)
    // Next Hajj (Approx May 16, 2027)
    const now = new Date();
    const nextRamadan = new Date('2027-02-08');
    const nextHajj = new Date('2027-05-16');

    // If past, add a year (simplified)
    if (now > nextRamadan) nextRamadan.setFullYear(now.getFullYear() + 1);
    if (now > nextHajj) nextHajj.setFullYear(now.getFullYear() + 1);

    const msPerDay = 1000 * 60 * 60 * 24;
    setDaysToRamadan(Math.ceil((nextRamadan.getTime() - now.getTime()) / msPerDay));
    setDaysToHajj(Math.ceil((nextHajj.getTime() - now.getTime()) / msPerDay));
  }, [session]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-purple-100 dark:border-purple-900/30">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
          <CalendarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400">Islamic Calendar</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" /> {locationStr}
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <h2 className="text-5xl md:text-7xl font-bold text-purple-900 dark:text-purple-100 mb-4">{hijriDateString}</h2>
        <p className="text-xl text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Clock className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <h3 className="text-xl font-bold mb-2">Countdown to Ramadan</h3>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{daysToRamadan}</span>
              <span className="text-xl mb-1 text-amber-100">Days</span>
            </div>
            <p className="mt-4 text-amber-100 text-sm">O Allah, let us reach Ramadan.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Clock className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <h3 className="text-xl font-bold mb-2">Countdown to Hajj</h3>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{daysToHajj}</span>
              <span className="text-xl mb-1 text-emerald-100">Days</span>
            </div>
            <p className="mt-4 text-emerald-100 text-sm">Labbaik Allahumma Labbaik.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">Upcoming Islamic Events</h3>
        <div className="space-y-4">
          {[
            { event: 'Ashura', date: '10 Muharram', details: 'Fasting is highly recommended.' },
            { event: 'Mawlid al-Nabi', date: '12 Rabi al-Awwal', details: 'Observance of the Prophet\'s (ﷺ) birth.' },
            { event: 'Laylat al-Miraj', date: '27 Rajab', details: 'The Night Journey.' },
            { event: 'Laylat al-Bara\'at', date: '15 Sha\'ban', details: 'The Night of Records.' },
            { event: 'Eid al-Fitr', date: '1 Shawwal', details: 'Festival of Breaking the Fast.' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-lg">{item.event}</h4>
                <p className="text-sm text-muted-foreground">{item.details}</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-purple-600 dark:text-purple-400">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
