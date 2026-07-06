'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getLastRead } from '@/app/actions/lastReadActions';
import { fetchSurahDetail } from '@/app/actions/quranActions';
import { AyahBlock } from '@/components/quran/AyahBlock';
import { QuranNavigator } from '@/components/quran/QuranNavigator';
import { SurahScrollTracker } from '@/components/quran/SurahScrollTracker';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function SurahDetailPage() {
  const params = useParams();
  const surahId = parseInt(params.surahId as string, 10);

  const [surahs, setSurahs] = useState<any[]>([]);
  const [lastRead, setLastRead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [nextSurahId, setNextSurahId] = useState<number>(surahId + 1);
  const [error, setError] = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const lastReadData = await getLastRead();
      setLastRead(lastReadData);
    } catch (err) {
      console.error('Error fetching last read:', err);
    }
  };

  useEffect(() => {
    if (surahId) {
      const resetAndLoad = async () => {
        try {
          setLoading(true);
          setError(null);
          const [surahData, lastReadData] = await Promise.all([
            fetchSurahDetail(surahId),
            getLastRead()
          ]);
          if (!surahData) {
            throw new Error('Failed to load Surah details.');
          }
          setSurahs([surahData]);
          setLastRead(lastReadData);
          setNextSurahId(surahId + 1);
        } catch (err: any) {
          console.error('Error fetching surah detail:', err);
          setError(err.message || 'Error loading Surah.');
        } finally {
          setLoading(false);
        }
      };
      resetAndLoad();
    }
  }, [surahId]);

  // Anchor scroll effect once loading is done
  useEffect(() => {
    if (!loading && typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400); // 400ms delay to allow DOM nodes to mount and render fully
      }
    }
  }, [loading]);

  const loadNextSurah = async () => {
    if (loadingNext || nextSurahId > 114) return;
    setLoadingNext(true);
    try {
      const nextData = await fetchSurahDetail(nextSurahId);
      if (nextData) {
        setSurahs(prev => [...prev, nextData]);
        setNextSurahId(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to load next surah:', err);
    } finally {
      setLoadingNext(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingNext && nextSurahId <= 114 && surahs.length > 0) {
        loadNextSurah();
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [nextSurahId, loadingNext, surahs.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm font-medium">Loading Surah chapters...</p>
      </div>
    );
  }

  if (error || surahs.length === 0) {
    return (
      <div className="flex justify-center mt-20 text-red-500 font-semibold">
        {error || 'Error loading Surah.'}
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-32">
      <SurahScrollTracker 
        surahNumber={surahId}
        lastReadAyahNumber={lastRead && lastRead.surahNumber === surahId ? lastRead.ayahNumber : null}
      />
      
      {surahs.map((surahData) => {
        const { arabic, tajweed, english, urdu } = surahData;
        const currentSurahNumber = arabic.number;

        return (
          <div key={currentSurahNumber} className="space-y-8">
            <div className="text-center space-y-4 py-8 border-b border-emerald-100 dark:border-emerald-900 mt-8">
              <h1 className="text-4xl md:text-6xl font-arabic text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Amiri, serif' }}>
                {arabic.name}
              </h1>
              <h2 className="text-xl font-medium">{arabic.englishName} ({arabic.englishNameTranslation})</h2>
              <p className="text-muted-foreground text-sm">{arabic.revelationType} • {arabic.numberOfAyahs} Ayahs</p>
            </div>

            <QuranNavigator currentSurahNumber={currentSurahNumber} />

            <div className="space-y-6">
              {arabic.ayahs.map((ayah: any, index: number) => {
                const engAyah = english.ayahs[index];
                const urduAyah = urdu.ayahs[index];
                const isLastReadAyah = lastRead && lastRead.surahNumber === currentSurahNumber && lastRead.ayahNumber === ayah.numberInSurah;

                return (
                  <AyahBlock
                    key={ayah.number}
                    surahNumber={currentSurahNumber}
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
      })}

      {nextSurahId <= 114 && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}
    </div>
  );
}


