'use client';

import React, { useState, useEffect } from 'react';
import { getLastRead } from '@/app/actions/lastReadActions';
import { AyahBlock } from '@/components/quran/AyahBlock';
import { QuranNavigator } from '@/components/quran/QuranNavigator';
import { SurahScrollTracker } from '@/components/quran/SurahScrollTracker';
import { Loader2 } from 'lucide-react';

const BASE_URL = 'https://api.alquran.cloud/v1';

async function fetchSurahDetailClient(surahNumber: number) {
  // Fetch Arabic, Tajweed, English translation, and Urdu translation simultaneously
  const [arabicRes, tajweedRes, englishRes, urduRes] = await Promise.all([
    fetch(`${BASE_URL}/surah/${surahNumber}`),
    fetch(`${BASE_URL}/surah/${surahNumber}/ar.tajweed`),
    fetch(`${BASE_URL}/surah/${surahNumber}/en.asad`),
    fetch(`${BASE_URL}/surah/${surahNumber}/ur.jalandhry`),
  ]);

  if (!arabicRes.ok || !tajweedRes.ok || !englishRes.ok || !urduRes.ok) {
    throw new Error('Failed to fetch surah details');
  }

  const arabicData = await arabicRes.json();
  const tajweedData = await tajweedRes.json();
  const englishData = await englishRes.json();
  const urduData = await urduRes.json();

  return {
    arabic: arabicData.data,
    tajweed: tajweedData.data,
    english: englishData.data,
    urdu: urduData.data,
  };
}

export default function SurahDetailPage({ params }: { params: any }) {
  const resolvedParams = React.use(params) as any;
  const surahId = parseInt(resolvedParams.surahId, 10);

  const [data, setData] = useState<any>(null);
  const [lastRead, setLastRead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [surahData, lastReadData] = await Promise.all([
        fetchSurahDetailClient(surahId),
        getLastRead()
      ]);
      setData(surahData);
      setLastRead(lastReadData);
    } catch (err: any) {
      console.error('Error fetching surah detail client-side:', err);
      setError(err.message || 'Error loading Surah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (surahId) {
      loadData();
    }
  }, [surahId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm font-medium">Loading Surah chapters...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center mt-20 text-red-500 font-semibold">
        {error || 'Error loading Surah.'}
      </div>
    );
  }

  const { arabic, tajweed, english, urdu } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-32">
      <SurahScrollTracker 
        surahNumber={surahId}
        lastReadAyahNumber={lastRead && lastRead.surahNumber === surahId ? lastRead.ayahNumber : null}
      />
      <div className="text-center space-y-4 py-8 border-b border-emerald-100 dark:border-emerald-900">
        <h1 className="text-4xl md:text-6xl font-arabic text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Amiri, serif' }}>
          {arabic.name}
        </h1>
        <h2 className="text-xl font-medium">{arabic.englishName} ({arabic.englishNameTranslation})</h2>
        <p className="text-muted-foreground text-sm">{arabic.revelationType} • {arabic.numberOfAyahs} Ayahs</p>
      </div>

      <QuranNavigator currentSurahNumber={surahId} />

      <div className="space-y-6">
        {arabic.ayahs.map((ayah: any, index: number) => {
          const engAyah = english.ayahs[index];
          const urduAyah = urdu.ayahs[index];
          const isLastReadAyah = lastRead && lastRead.surahNumber === surahId && lastRead.ayahNumber === ayah.numberInSurah;

          return (
            <AyahBlock
              key={ayah.number}
              surahNumber={surahId}
              ayahNumber={ayah.numberInSurah}
              surahName={english.englishName}
              arabicText={ayah.text}
              translationText={engAyah.text}
              urduText={urduAyah.text}
              tajweedText={tajweed ? tajweed.ayahs[index].text : undefined}
              isLastRead={!!isLastReadAyah}
              onLastReadUpdated={loadData}
            />
          );
        })}
      </div>
    </div>
  );
}


