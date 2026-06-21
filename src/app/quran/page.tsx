'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Bookmark, ArrowRight, Loader2 } from 'lucide-react';
import { fetchSurahList } from '@/app/actions/quranActions';
import { useSession } from 'next-auth/react';
import { QuranNavigator } from '@/components/quran/QuranNavigator';
import { toggleJuzCompleted, incrementKhatmCount, setKhatmTarget, getQuranPageData } from '@/app/actions/quranProgressActions';
import { KhatmTracker } from '@/components/quran/KhatmTracker';

const JUZ_MAPPING = [
  { juz: 1, name: "Juz 1 (Alif Lam Mim)", surah: 1, ayah: 1, label: "Al-Fatihah 1:1" },
  { juz: 2, name: "Juz 2 (Sayaqul)", surah: 2, ayah: 142, label: "Al-Baqarah 2:142" },
  { juz: 3, name: "Juz 3 (Tilkal Rusul)", surah: 2, ayah: 253, label: "Al-Baqarah 2:253" },
  { juz: 4, name: "Juz 4 (Lan Tanalu)", surah: 3, ayah: 93, label: "Ali 'Imran 3:93" },
  { juz: 5, name: "Juz 5 (Wal Muhsanat)", surah: 4, ayah: 24, label: "An-Nisa 4:24" },
  { juz: 6, name: "Juz 6 (La Yuhibbullahu)", surah: 4, ayah: 148, label: "An-Nisa 4:148" },
  { juz: 7, name: "Juz 7 (Wa Iza Sami'u)", surah: 5, ayah: 82, label: "Al-Ma'idah 5:82" },
  { juz: 8, name: "Juz 8 (Wa Lau Annana)", surah: 6, ayah: 111, label: "Al-An'am 6:111" },
  { juz: 9, name: "Juz 9 (Qal Al-Mala'u)", surah: 7, ayah: 88, label: "Al-A'raf 7:88" },
  { juz: 10, name: "Juz 10 (Wa'lamu)", surah: 8, ayah: 41, label: "Al-Anfal 8:41" },
  { juz: 11, name: "Juz 11 (Ya'tazirun)", surah: 9, ayah: 93, label: "At-Tawbah 9:93" },
  { juz: 12, name: "Juz 12 (Wa Mamin Dabbatin)", surah: 11, ayah: 6, label: "Hud 11:6" },
  { juz: 13, name: "Juz 13 (Wa Ma Ubarri'u)", surah: 12, ayah: 53, label: "Yusuf 12:53" },
  { juz: 14, name: "Juz 14 (Rubama)", surah: 15, ayah: 1, label: "Al-Hijr 15:1" },
  { juz: 15, name: "Juz 15 (Subhana Allazi)", surah: 17, ayah: 1, label: "Al-Isra 17:1" },
  { juz: 16, name: "Juz 16 (Qala Alam)", surah: 18, ayah: 75, label: "Al-Kahf 18:75" },
  { juz: 17, name: "Juz 17 (Iqtaraba)", surah: 21, ayah: 1, label: "Al-Anbiya 21:1" },
  { juz: 18, name: "Juz 18 (Qad Aflaha)", surah: 23, ayah: 1, label: "Al-Mu'minun 23:1" },
  { juz: 19, name: "Juz 19 (Wa Qala Allazina)", surah: 25, ayah: 21, label: "Al-Furqan 25:21" },
  { juz: 20, name: "Juz 20 (Aman Khalaqa)", surah: 27, ayah: 56, label: "An-Naml 27:56" },
  { juz: 21, name: "Juz 21 (Utlu Ma Uhiya)", surah: 29, ayah: 46, label: "Al-'Ankabut 29:46" },
  { juz: 22, name: "Juz 22 (Wa Man Yaqnut)", surah: 33, ayah: 31, label: "Al-Ahzab 33:31" },
  { juz: 23, name: "Juz 23 (Wa Maliya)", surah: 36, ayah: 28, label: "Ya-Sin 36:28" },
  { juz: 24, name: "Juz 24 (Faman Azlamu)", surah: 39, ayah: 32, label: "Az-Zumar 39:32" },
  { juz: 25, name: "Juz 25 (Ilaihi Yuraddu)", surah: 41, ayah: 47, label: "Fussilat 41:47" },
  { juz: 26, name: "Juz 26 (Ha Mim)", surah: 46, ayah: 1, label: "Al-Ahqaf 46:1" },
  { juz: 27, name: "Juz 27 (Qala Fama Khatbukum)", surah: 51, ayah: 31, label: "Adh-Dhariyat 51:31" },
  { juz: 28, name: "Juz 28 (Qad Sami'allahu)", surah: 58, ayah: 1, label: "Al-Mujadilah 58:1" },
  { juz: 29, name: "Juz 29 (Tabarakallazi)", surah: 67, ayah: 1, label: "Al-Mulk 67:1" },
  { juz: 30, name: "Juz 30 ('Amma)", surah: 78, ayah: 1, label: "An-Naba 78:1" }
];

export default function QuranIndexPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'resume' | 'surahs' | 'parahs' | 'bookmarks' | 'khatm'>('resume');
  const [loading, setLoading] = useState(true);

  // States
  const [surahList, setSurahList] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [lastRead, setLastRead] = useState<any>(null);
  const [quranProgress, setQuranProgress] = useState<any>(null);

  const loadQuranData = async () => {
    setLoading(true);
    try {
      const [list, data] = await Promise.all([
        fetchSurahList(),
        session ? getQuranPageData() : null
      ]);

      if (list) {
        setSurahList(list.data);
      }

      if (data) {
        setBookmarks(data.bookmarks || []);
        setLastRead(data.lastRead);
        setQuranProgress(data.quranProgress);
      }
    } catch (err) {
      console.error('Failed to load Quran dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuranData();
  }, [session]);

  const getSurahNameByNumber = (num: number) => {
    const surah = surahList.find((s) => s.number === num);
    return surah ? surah.englishName : `Surah ${num}`;
  };

  const isPageLoading = loading && surahList.length === 0;
  if (isPageLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Opening the Noble Quran...</p>
      </div>
    );
  }

  const lastReadSurahName = lastRead ? getSurahNameByNumber(lastRead.surahNumber) : '';

  return (
    <div className="space-y-8 pb-32">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">The Noble Quran</h2>
        <p className="text-muted-foreground mt-1">Read, listen, and contemplate the words of Allah.</p>
      </div>

      <QuranNavigator />

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto hide-scrollbar whitespace-nowrap gap-1">
        <button
          onClick={() => setActiveTab('resume')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'resume'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Normal Quran
        </button>
        <button
          onClick={() => setActiveTab('surahs')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'surahs'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Surah Index
        </button>
        <button
          onClick={() => setActiveTab('parahs')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'parahs'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Parah Index
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'bookmarks'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Bookmarks ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('khatm')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'khatm'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Khtm & Juz Tracker
        </button>
      </div>

      {activeTab === 'resume' && (
        <div className="space-y-6">
          {lastRead ? (
            <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20 dark:border-emerald-500/10 shadow-lg relative overflow-hidden p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-emerald-700 dark:text-emerald-300 font-bold text-xl">Resume Reading</h3>
                    <p className="text-xs text-muted-foreground">Pick up exactly where you left off</p>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                    {lastReadSurahName}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Ayah Number: <span className="font-bold text-emerald-600 dark:text-emerald-400">{lastRead.ayahNumber}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Reading history auto-updates as you scroll through Quran pages.
                  </p>
                </div>

                <Link href={`/quran/${lastRead.surahNumber}#ayah-${lastRead.ayahNumber}`} className="inline-flex">
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-102">
                    Open Quran Reader <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-850 text-center p-12 space-y-4">
              <div className="w-16 h-16 bg-slate-50/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-850 dark:text-slate-200">Start Your Quran Journey</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                No checkpoint found. Start reading from the very beginning (Surah Al-Fatihah) to begin auto-tracking.
              </p>
              <Link href="/quran/1" className="inline-flex">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl">
                  Start Reading
                </button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'surahs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surahList.map((surah) => (
            <Link href={`/quran/${surah.number}`} key={surah.number}>
              <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-bold group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all">
                      {surah.number}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">{surah.englishName}</h3>
                      <p className="text-xs text-muted-foreground">{surah.englishNameTranslation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-arabic font-semibold" style={{ fontFamily: 'Amiri, serif' }}>{surah.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{surah.numberOfAyahs} Ayahs</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'parahs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {JUZ_MAPPING.map((j) => (
            <Link href={`/quran/${j.surah}#ayah-${j.ayah}`} key={j.juz}>
              <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer border-slate-200 dark:border-slate-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {j.juz}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">{j.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Starts at {j.label}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground text-sm">
              No bookmarked verses yet. While reading a Surah, click the bookmark icon to save verses here.
            </div>
          ) : (
            bookmarks.map((bookmark) => {
              const surahName = getSurahNameByNumber(bookmark.surahNumber);
              return (
                <Link href={`/quran/${bookmark.surahNumber}#ayah-${bookmark.ayahNumber}`} key={bookmark._id}>
                  <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 px-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Bookmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200">
                            {surahName} (Ayah {bookmark.ayahNumber})
                          </h4>
                          <p className="text-xs text-muted-foreground">Saved on {new Date(bookmark.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'khatm' && (
        <KhatmTracker
          progress={quranProgress}
          onToggleJuz={async (juzNum, completed) => {
            const res = await toggleJuzCompleted(juzNum, completed);
            if (res.success) {
              setQuranProgress(res.progress);
            }
          }}
          onIncrementKhatm={async () => {
            const res = await incrementKhatmCount();
            if (res.success) {
              setQuranProgress(res.progress);
            }
          }}
          onSetTargetDate={async (targetDateStr) => {
            const res = await setKhatmTarget(targetDateStr);
            if (res.success) {
              setQuranProgress(res.progress);
            }
          }}
        />
      )}
    </div>
  );
}
