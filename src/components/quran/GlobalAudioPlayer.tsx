'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { getAyahAudioUrl, RECITERS } from '@/app/actions/audioActions';
import { Play, Pause, SkipForward, SkipBack, Volume2, X, Timer, ListMusic, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function GlobalAudioPlayer() {
  const { 
    isPlaying, 
    currentSurah, 
    currentAyah, 
    reciterId, 
    playbackSpeed, 
    setPlaying, 
    nextAyah, 
    prevAyah,
    setReciter,
    playlist,
    playlistIndex,
    addSurahToPlaylist,
    clearPlaylist,
    playPlaylist
  } = useAudioStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');

  // Sleep Timer local states
  const [sleepSecondsRemaining, setSleepSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    async function loadAudio() {
      if (currentSurah && currentAyah) {
        const url = await getAyahAudioUrl(reciterId, currentSurah, currentAyah);
        setAudioUrl(url);
      }
    }
    loadAudio();
  }, [currentSurah, currentAyah, reciterId]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [isPlaying, audioUrl, playbackSpeed]);

  // Sleep Timer Countdown Logic
  useEffect(() => {
    if (sleepSecondsRemaining === null) return;

    if (sleepSecondsRemaining <= 0) {
      setPlaying(false);
      setSleepSecondsRemaining(null);
      return;
    }

    const timer = setTimeout(() => {
      setSleepSecondsRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [sleepSecondsRemaining]);

  if (!currentSurah || !currentAyah) return null;

  const currentReciter = RECITERS.find(r => r.identifier === reciterId);

  const handleSetSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepSecondsRemaining(null);
    } else {
      setSleepSecondsRemaining(minutes * 60);
    }
  };

  const formatTimeRemaining = () => {
    if (sleepSecondsRemaining === null) return '';
    const m = Math.floor(sleepSecondsRemaining / 60);
    const s = sleepSecondsRemaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 inset-x-0 md:pl-72 z-50 p-4 pointer-events-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex items-center justify-between pointer-events-auto max-w-4xl mx-auto backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-sm sm:text-base">Surah {currentSurah}, Ayah {currentAyah}</p>
            <DropdownMenu>
              {/* @ts-expect-error React 19 compat */}
              <DropdownMenuTrigger asChild>
                <button className="text-xs text-muted-foreground hover:text-emerald-500 transition-colors">
                  {currentReciter?.name || 'Select Reciter'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {RECITERS.map(reciter => (
                  <DropdownMenuItem key={reciter.identifier} onClick={() => setReciter(reciter.identifier)}>
                    {reciter.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="text-slate-500" onClick={prevAyah}>
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button 
            onClick={() => setPlaying(!isPlaying)} 
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>

          <Button variant="ghost" size="icon" className="text-slate-500" onClick={nextAyah}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Sleep Timer, Playlist, Close */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Playlist Queue trigger */}
          <Sheet>
            {/* @ts-expect-error React 19 compat */}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-emerald-500 relative">
                <ListMusic className="w-5 h-5" />
                {playlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {playlist.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-6 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg font-bold flex items-center justify-between">
                  <span>Audio Queue</span>
                  {playlist.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 flex items-center gap-1" onClick={clearPlaylist}>
                      <Trash2 className="w-4 h-4" /> Clear
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-4 h-[calc(100vh-120px)] overflow-hidden">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs flex items-center gap-1 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => addSurahToPlaylist(currentSurah)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Queue Surah {currentSurah}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {playlist.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Queue is empty. Select Surah or Ayah to queue.
                    </div>
                  ) : (
                    playlist.map((track, idx) => {
                      const isActive = playlistIndex === idx;
                      return (
                        <div 
                          key={idx}
                          onClick={() => playPlaylist(idx)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                            isActive 
                              ? 'bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs opacity-50 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                            <div>
                              <p className="font-medium text-sm">Surah {track.surah}, Ayah {track.ayah}</p>
                            </div>
                          </div>
                          {isActive && (
                            <span className="text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">Playing</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            {/* @ts-expect-error React 19 compat */}
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-500 flex items-center gap-1.5 hover:text-emerald-500">
                {sleepSecondsRemaining !== null ? (
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {formatTimeRemaining()}
                  </span>
                ) : (
                  <Timer className="w-4 h-4" />
                )}
                <span className="hidden md:inline text-xs">Sleep Timer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSetSleepTimer(null)}>Off</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetSleepTimer(5)}>5 Minutes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetSleepTimer(15)}>15 Minutes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetSleepTimer(30)}>30 Minutes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetSleepTimer(60)}>60 Minutes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-rose-500 transition-colors" onClick={() => useAudioStore.setState({ currentSurah: null })}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={nextAyah}
          className="hidden"
        />
      </div>
    </div>
  );
}

