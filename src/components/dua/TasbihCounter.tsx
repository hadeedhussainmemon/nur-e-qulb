'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTasbihPresets } from '@/app/actions/adminActions';

export function TasbihCounter() {
  const [adhkarList, setAdhkarList] = useState([
    { id: 'subhanallah', text: 'Subhanallah', arabic: 'سُبْحَانَ ٱللَّٰهِ', target: 33 },
    { id: 'alhamdulillah', text: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
    { id: 'allahuakbar', text: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', target: 34 },
    { id: 'astaghfirullah', text: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  ]);

  const [activeDhikr, setActiveDhikr] = useState(0);
  const [count, setCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await getTasbihPresets();
        if (data && data.length > 0) {
          setAdhkarList(data);
        }
      } catch (err) {
        console.error('Failed to load tasbih presets:', err);
      }
    }
    loadPresets();
  }, []);

  const currentDhikr = adhkarList[activeDhikr] || adhkarList[0];
  const progress = Math.min((count / currentDhikr.target) * 100, 100);

  const tasbihAudioRef = React.useRef<AudioContext | null>(null);

  const playClickSound = useCallback((freq = 880, duration = 0.1) => {
    try {
      if (!tasbihAudioRef.current || tasbihAudioRef.current.state === 'closed') {
        tasbihAudioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = tasbihAudioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 4, ctx.currentTime + duration * 0.8);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch {}
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') {
        navigator.vibrate(40);
      } else {
        navigator.vibrate([80, 40, 80]); // Heavy double vibration
      }
    }
  }, []);

  const handleTap = () => {
    if (isCompleted) {
      // Move to next dhikr automatically
      const nextIndex = (activeDhikr + 1) % adhkarList.length;
      setActiveDhikr(nextIndex);
      setCount(1);
      setIsCompleted(false);
      triggerHaptic('light');
      playClickSound(880, 0.1);
      return;
    }

    const newCount = count + 1;
    setCount(newCount);

    if (newCount === currentDhikr.target) {
      setIsCompleted(true);
      triggerHaptic('heavy');
      try {
        playClickSound(1000, 0.15);
        setTimeout(() => playClickSound(1300, 0.25), 100);
      } catch {}
    } else {
      triggerHaptic('light');
      playClickSound(880, 0.1);
    }
  };

  const handleReset = () => {
    setCount(0);
    setIsCompleted(false);
    triggerHaptic('light');
  };

  return (
    <div className="space-y-12 w-full max-w-sm mx-auto">
      {/* Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 snap-x hide-scrollbar">
        {adhkarList.map((dhikr, index) => (
          <button
            key={dhikr.id}
            onClick={() => {
              setActiveDhikr(index);
              setCount(0);
              setIsCompleted(false);
            }}
            className={`snap-center shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              activeDhikr === index
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {dhikr.text}
          </button>
        ))}
      </div>

      {/* Main Counter Area */}
      <div className="text-center space-y-6">
        <h2 className="text-4xl font-arabic text-slate-800 dark:text-slate-100" style={{ fontFamily: 'Amiri, serif' }}>
          {currentDhikr.arabic}
        </h2>

        {/* The Tap Area */}
        <div className="relative w-64 h-64 mx-auto cursor-pointer touch-none select-none" onClick={handleTap}>
          {/* Progress Circle SVG */}
          <svg className="w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Progress */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={`transition-all duration-300 ease-out ${isCompleted ? 'text-emerald-500' : 'text-rose-500'}`}
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-transform active:scale-95 duration-100">
            {isCompleted ? (
              <div className="text-emerald-500 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-16 h-16 mx-auto" />
                <p className="font-bold mt-2 text-sm uppercase tracking-widest">Complete</p>
              </div>
            ) : (
              <>
                <span className="text-7xl font-bold tracking-tighter text-slate-800 dark:text-slate-100">{count}</span>
                <span className="text-sm font-medium text-muted-foreground mt-1">/ {currentDhikr.target}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground pt-4">Tap anywhere on the circle to count</p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={handleReset}>
          <RefreshCcw className="w-5 h-5 text-slate-500" />
        </Button>
      </div>
    </div>
  );
}
