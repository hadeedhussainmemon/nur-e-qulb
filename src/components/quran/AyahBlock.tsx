'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Bookmark, Heart, Share2, BookOpen, Check, Loader2 } from 'lucide-react';
import { useAudioStore } from '@/store/useAudioStore';
import { ShareCard } from './ShareCard';
import { TajweedText } from './TajweedText';
import { toggleQuranBookmark, isQuranBookmarked } from '@/app/actions/bookmarkActions';
import { saveLastRead } from '@/app/actions/lastReadActions';
import { fetchAyahTafsir } from '@/app/actions/quranActions';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';

interface AyahBlockProps {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  arabicText: string;
  translationText: string;
  urduText: string;
  tajweedText?: string;
  isLastRead?: boolean;
  onLastReadUpdated?: () => void;
}

export function AyahBlock({
  surahNumber,
  ayahNumber,
  surahName,
  arabicText,
  translationText,
  urduText,
  tajweedText,
  isLastRead: initialIsLastRead = false,
  onLastReadUpdated,
}: AyahBlockProps) {
  const { data: session } = useSession();
  const { currentSurah, currentAyah, isPlaying, playAyah, stopAudio } = useAudioStore();

  const [bookmarked, setBookmarked] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Tafsir states
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState('');
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  // Last Read states
  const [isLastRead, setIsLastRead] = useState(initialIsLastRead);
  const [savingProgress, setSavingProgress] = useState(false);

  const isCurrentlyPlaying = currentSurah === surahNumber && currentAyah === ayahNumber && isPlaying;

  // Auto-scroll to this block when it becomes the active playing ayah
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isCurrentlyPlaying && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentlyPlaying]);

  useEffect(() => {
    async function checkBookmark() {
      if (session) {
        const isBook = await isQuranBookmarked(surahNumber, ayahNumber);
        setBookmarked(isBook);
      }
    }
    checkBookmark();
  }, [surahNumber, ayahNumber, session]);

  useEffect(() => {
    setIsLastRead(initialIsLastRead);
  }, [initialIsLastRead]);

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      stopAudio();
    } else {
      playAyah(surahNumber, ayahNumber);
    }
  };

  const handleToggleBookmark = async () => {
    if (!session) return;
    setBookmarked(!bookmarked);
    const result = await toggleQuranBookmark(surahNumber, ayahNumber);
    if (!result.success) {
      setBookmarked(bookmarked); // Revert if failed
    }
  };

  const handleToggleTafsir = async () => {
    if (tafsirOpen) {
      setTafsirOpen(false);
      return;
    }

    setTafsirOpen(true);
    if (!tafsirText) {
      setLoadingTafsir(true);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.jalalayn`);
        if (!res.ok) throw new Error('Failed to fetch Tafsir');
        const data = await res.json();
        setTafsirText(data.data.text);
      } catch (err) {
        setTafsirText('Failed to load Tafsir. Please check your connection.');
      } finally {
        setLoadingTafsir(false);
      }
    }
  };

  const handleMarkLastRead = async () => {
    if (!session) return;
    setSavingProgress(true);
    try {
      const res = await saveLastRead(surahNumber, ayahNumber);
      if (res.success) {
        if (onLastReadUpdated) {
          onLastReadUpdated();
        } else {
          setIsLastRead(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`p-4 rounded-2xl border transition-all space-y-6 scroll-mt-24 ${
        isCurrentlyPlaying
          ? 'border-primary/60 bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30 shadow-lg'
          : isLastRead
          ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10'
          : 'border-slate-100 dark:border-slate-900 bg-card'
      }`}
      id={`ayah-${ayahNumber}`}
    >
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-600 dark:text-emerald-500">{surahNumber}:{ayahNumber}</span>
          {isLastRead && (
            <Badge className="bg-emerald-500/10 border-transparent text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Last Read Checkpoint
            </Badge>
          )}
        </div>

        {/* Controls Grid */}
        <div className="flex items-center gap-1">
          {/* Play Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-lg ${isCurrentlyPlaying ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900" : "text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"}`}
            onClick={handlePlay}
            title={isCurrentlyPlaying ? "Pause Ayah Recitation" : "Play Ayah Recitation"}
          >
            {isCurrentlyPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>

          {/* Bookmark Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-lg ${bookmarked ? "text-amber-500 bg-amber-500/10" : "text-slate-400 hover:text-amber-500"}`}
            onClick={handleToggleBookmark}
            title={bookmarked ? "Unbookmark Ayah" : "Bookmark Ayah"}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </Button>

          {/* Tafsir Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 rounded-lg text-xs font-semibold ${tafsirOpen ? "bg-emerald-500/10 text-emerald-600" : "text-slate-400 hover:text-emerald-600"}`}
            onClick={handleToggleTafsir}
            title="Toggle Tafsir Explanation"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 inline" /> Tafsir
          </Button>

          {/* Last Read Checkpoint Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            disabled={isLastRead || savingProgress}
            className={`h-8 w-8 rounded-lg ${isLastRead ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-emerald-500"}`}
            onClick={handleMarkLastRead}
            title="Set as Last Read Progress"
          >
            {savingProgress ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isLastRead ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
            )}
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500"
            onClick={() => setIsShareOpen(true)}
            title="Create Shareable Card"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Arabic text block */}
      <div className="text-right">
        {tajweedText ? (
          <TajweedText text={tajweedText} />
        ) : (
          <p className="text-3xl md:text-4xl leading-loose font-arabic text-slate-900 dark:text-slate-100" style={{ fontFamily: 'Amiri, serif', lineHeight: '2.5' }}>
            {arabicText}
          </p>
        )}
      </div>

      {/* Translations block */}
      <div className="space-y-4">
        <p className="text-base md:text-lg text-slate-700 dark:text-slate-300">
          {translationText}
        </p>
        <p className="text-xl text-right text-slate-600 dark:text-slate-400 font-arabic" style={{ fontFamily: 'Jameel Noori Nastaleeq, Amiri, serif', lineHeight: '2' }}>
          {urduText}
        </p>
      </div>

      {/* Tafsir Expandable Panel */}
      {tafsirOpen && (
        <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/10 text-slate-700 dark:text-slate-300 space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tafsir al-Jalalayn (Arabic Explanation)</h5>
          {loadingTafsir ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>Fetching Tafsir...</span>
            </div>
          ) : (
            <p className="text-lg text-right font-arabic leading-relaxed" style={{ fontFamily: 'Amiri, serif', lineHeight: '2' }}>
              {tafsirText}
            </p>
          )}
        </div>
      )}

      {/* Share Image Card Dialog overlay */}
      <ShareCard 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        arabicText={arabicText}
        translationText={translationText}
        reference={`${surahName} ${surahNumber}:${ayahNumber}`}
      />
    </div>
  );
}
