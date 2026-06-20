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

export default function QuranIndexPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks' | 'khatm'>('surahs');
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

  if (loading) {
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

      {/* Continue Reading Banner */}
      {lastRead && (
        <Link href={`/quran/${lastRead.surahNumber}#ayah-${lastRead.ayahNumber}`}>
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/10 cursor-pointer shadow-md group transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <BookOpen className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Continue Reading</p>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-0.5">
                    {lastReadSurahName} (Ayah {lastRead.ayahNumber})
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

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('surahs')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'surahs'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Surah Index
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'bookmarks'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Bookmarks ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('khatm')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'khatm'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Khatm & Juz Tracker
        </button>
      </div>

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
