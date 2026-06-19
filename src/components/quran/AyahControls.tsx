'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Bookmark, Heart, Share2 } from 'lucide-react';
import { useAudioStore } from '@/store/useAudioStore';
import { ShareCard } from './ShareCard';

interface AyahControlsProps {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  arabicText: string;
  translationText: string;
}

export function AyahControls({ surahNumber, ayahNumber, surahName, arabicText, translationText }: AyahControlsProps) {
  const { currentSurah, currentAyah, isPlaying, playAyah, stopAudio } = useAudioStore();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const isCurrentlyPlaying = currentSurah === surahNumber && currentAyah === ayahNumber && isPlaying;

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      stopAudio();
    } else {
      playAyah(surahNumber, ayahNumber);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className={isCurrentlyPlaying ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900" : "text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"}
          onClick={handlePlay}
        >
          {isCurrentlyPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500">
          <Bookmark className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500">
          <Heart className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-500" onClick={() => setIsShareOpen(true)}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      <ShareCard 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        arabicText={arabicText}
        translationText={translationText}
        reference={`${surahName} ${surahNumber}:${ayahNumber}`}
      />
    </>
  );
}
