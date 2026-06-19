import React from 'react';
import { fetchSurahDetail } from '@/app/actions/quranActions';
import { getLastRead } from '@/app/actions/lastReadActions';
import { AyahBlock } from '@/components/quran/AyahBlock';
import { QuranNavigator } from '@/components/quran/QuranNavigator';
import { SurahScrollTracker } from '@/components/quran/SurahScrollTracker';

export default async function SurahDetailPage({ params }: { params: { surahId: string } }) {
  const surahId = parseInt(params.surahId, 10);
  const data = await fetchSurahDetail(surahId);
  const lastRead = await getLastRead();

  if (!data) {
    return (
      <div className="flex justify-center mt-20 text-red-500">
        Error loading Surah.
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
            />
          );
        })}
      </div>
    </div>
  );
}
