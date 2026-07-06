'use client';

import { useState, useEffect } from 'react';
import { fetchPrayerTimesByCity, AlAdhanResponse } from '@/app/actions/prayerActions';

const METHOD_MAP: Record<string, number> = {
  'Jafari': 0,
  'University of Islamic Sciences, Karachi': 1,
  'ISNA': 2,
  'MWL': 3,
  'Umm Al-Qura': 4,
  'Egyptian': 5,
  'Tehran': 7,
  'Gulf': 8,
  'Kuwait': 9,
  'Qatar': 10,
  'Majlis Ugama Islam Singapura, Singapore': 11,
  'Union Organisation Islamique de France': 12,
  'Diyanet İşleri Başkanlığı, Turkey': 13,
  'Spiritual Administration of Muslims of Russia': 14
};

const SCHOOL_MAP: Record<string, number> = {
  'Standard': 0,
  'Hanafi': 1
};

export function usePrayerTimes(
  city: string,
  country: string,
  calculationMethod: string = 'ISNA',
  madhab: string = 'Hanafi'
) {
  const [data, setData] = useState<AlAdhanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; diffMs: number } | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string>('Unknown');

  const methodVal = METHOD_MAP[calculationMethod] ?? 2;
  const schoolVal = SCHOOL_MAP[madhab] ?? 1;

  useEffect(() => {
    async function loadData() {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const cacheKey = `prayer_times_${city}_${country}_${methodVal}_${schoolVal}_${todayStr}`;
      
      // Try cache first
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch (e) {}

      setLoading(true);
      try {
        // Fallback default city to Makkah if empty
        const res = await fetchPrayerTimesByCity(city || 'Makkah', country || 'Saudi Arabia', methodVal, schoolVal);
        if (res) {
          setData(res);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(res));
          } catch (e) {}
        } else {
          setError('Failed to fetch prayer data');
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [city, country, methodVal, schoolVal]);

  // Countdown logic
  useEffect(() => {
    if (!data) return;

    const interval = setInterval(() => {
      const now = new Date();
      const times = data.data.timings;

      // Filter to main 5 prayers
      const mainPrayers = [
        { name: 'Fajr', timeStr: times.Fajr },
        { name: 'Dhuhr', timeStr: times.Dhuhr },
        { name: 'Asr', timeStr: times.Asr },
        { name: 'Maghrib', timeStr: times.Maghrib },
        { name: 'Isha', timeStr: times.Isha },
      ];

      let next: { name: string; time: string; diffMs: number } | null = null;
      let curr = 'Isha'; // default to Isha if after all prayers

      for (let i = 0; i < mainPrayers.length; i++) {
        const p = mainPrayers[i];
        const [hours, minutes] = p.timeStr.split(':').map(Number);
        
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);

        if (now < prayerTime) {
          next = {
            name: p.name,
            time: p.timeStr,
            diffMs: prayerTime.getTime() - now.getTime()
          };
          curr = i === 0 ? 'Isha' : mainPrayers[i - 1].name;
          break;
        }
      }

      // If no next prayer found today, next is Fajr tomorrow
      if (!next) {
        const [hours, minutes] = times.Fajr.split(':').map(Number);
        const tmrwFajr = new Date();
        tmrwFajr.setDate(tmrwFajr.getDate() + 1);
        tmrwFajr.setHours(hours, minutes, 0, 0);

        next = {
          name: 'Fajr',
          time: times.Fajr,
          diffMs: tmrwFajr.getTime() - now.getTime()
        };
        curr = 'Isha';
      }

      setNextPrayer(next);
      setCurrentPrayer(curr);
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  return { data, loading, error, nextPrayer, currentPrayer };
}
