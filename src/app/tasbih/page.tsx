'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircleDot, RotateCcw, Volume2, VolumeX, ChevronDown } from 'lucide-react';

// ─── Dhikr Presets ────────────────────────────────────────────────────────────
const ADHKARS = [
  { id: 'subhanallah',  arabic: 'سُبْحَانَ اللَّه',   transliteration: 'Subhān Allāh',    meaning: 'Glory be to God',          target: 33  },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّه',  transliteration: 'Al-Ḥamdu Lillāh',  meaning: 'All praise is due to God', target: 33  },
  { id: 'allahuakbar',  arabic: 'اللَّهُ أَكْبَر',    transliteration: 'Allāhu Akbar',      meaning: 'God is the Greatest',      target: 34  },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّه', transliteration: 'Astaghfiru Allāh', meaning: 'I seek forgiveness of God',target: 100 },
  { id: 'lailaha',     arabic: 'لَا إِلَٰهَ إِلَّا اللَّه', transliteration: 'Lā Ilāha Illallāh', meaning: 'There is no god but God',  target: 100 },
  { id: 'salawat',    arabic: 'صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ', transliteration: 'Ṣallā Allāhu ʿalayhī wa-sallam', meaning: 'Blessings on the Prophet', target: 100 },
];

// ─── Web Audio Click Synthesis ─────────────────────────────────────────────
function playBeadClick(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

function playCompletionSound(ctx: AudioContext) {
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.25);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.3);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TasbihPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [completions, setCompletions] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [pressed, setPressed] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const active = ADHKARS[activeIdx];
  const progress = Math.min((count / active.target) * 100, 100);

  const getOrCreateAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const handleTap = useCallback(() => {
    setPressed(true);
    setTimeout(() => setPressed(false), 120);

    setCount((prev) => {
      const next = prev + 1;
      if (next >= active.target) {
        // Cycle complete
        setCompletions((c) => c + 1);
        setTotalCount((t) => t + active.target);
        if (soundOn) {
          const ctx = getOrCreateAudioCtx();
          playCompletionSound(ctx);
        }
        return 0;
      }
      if (soundOn) {
        const ctx = getOrCreateAudioCtx();
        playBeadClick(ctx);
      }
      setTotalCount((t) => t + 1);
      return next;
    });
  }, [active.target, soundOn, getOrCreateAudioCtx]);

  const handleReset = () => {
    setCount(0);
    setCompletions(0);
    setTotalCount(0);
  };

  const handleSelectAdhkar = (idx: number) => {
    setActiveIdx(idx);
    setCount(0);
    setCompletions(0);
    setTotalCount(0);
    setShowPicker(false);
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTap]);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-32 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            Tasbeeh Counter
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Tap the bead, press Space, or use a hardware button.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            title={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-full text-muted-foreground hover:text-red-500 transition-colors"
            title="Reset counter"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Adhkar Selector */}
      <div className="relative">
        <button
          onClick={() => setShowPicker((s) => !s)}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:border-primary transition-all"
        >
          <div className="text-left">
            <p className="font-semibold text-base">{active.transliteration}</p>
            <p className="text-xs text-muted-foreground">{active.meaning} · Target: {active.target}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showPicker ? 'rotate-180' : ''}`} />
        </button>

        {showPicker && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-card shadow-2xl overflow-hidden">
            {ADHKARS.map((dhikr, i) => (
              <button
                key={dhikr.id}
                onClick={() => handleSelectAdhkar(i)}
                className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-800 ${i === activeIdx ? 'bg-primary/10 font-semibold' : ''}`}
              >
                <span className="font-arabic text-lg block leading-relaxed">{dhikr.arabic}</span>
                <span className="text-xs text-muted-foreground">{dhikr.transliteration} · {dhikr.meaning}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Counter Button */}
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Circular progress ring + tap button */}
        <div className="relative flex items-center justify-center">
          <svg className="absolute" width="240" height="240" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="108" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
            <circle
              cx="120" cy="120" r="108"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 108}`}
              strokeDashoffset={`${2 * Math.PI * 108 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>

          <button
            onPointerDown={handleTap}
            className={`relative z-10 w-52 h-52 rounded-full flex flex-col items-center justify-center gap-2 cursor-pointer
              bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-2xl
              transition-all duration-100 active:scale-95
              ${pressed ? 'scale-95 shadow-lg' : 'scale-100 shadow-2xl hover:scale-[1.02]'}`}
            aria-label="Tap to count"
          >
            <CircleDot className="w-10 h-10 opacity-70" />
            <span className="text-5xl font-bold font-mono leading-none">{count}</span>
            <span className="text-sm opacity-70 font-medium">/ {active.target}</span>
          </button>
        </div>

        {/* Arabic text */}
        <div className="text-center space-y-1">
          <p className="font-arabic text-4xl leading-loose text-foreground">{active.arabic}</p>
          <p className="text-muted-foreground text-sm">{active.meaning}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-bold font-mono text-primary">{count}</p>
            <p className="text-xs text-muted-foreground mt-1">Current Round</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-bold font-mono text-emerald-500">{completions}</p>
            <p className="text-xs text-muted-foreground mt-1">Rounds Done</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-bold font-mono text-violet-500">{totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Beads</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Tap anywhere on the bead · Press <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono">Space</kbd> for hands-free counting
      </p>
    </div>
  );
}
