'use client';

import { useEffect, useRef } from 'react';
import { saveLastRead } from '@/app/actions/lastReadActions';

interface SurahScrollTrackerProps {
  surahNumber: number;
  lastReadAyahNumber?: number | null;
}

export function SurahScrollTracker({ surahNumber, lastReadAyahNumber }: SurahScrollTrackerProps) {
  const activeAyahRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Auto-scroll to checkpoint on mount
  useEffect(() => {
    if (lastReadAyahNumber && lastReadAyahNumber > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`ayah-${lastReadAyahNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [surahNumber, lastReadAyahNumber]);

  // 2. Auto-save checkpoint on scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const ayahNum = parseInt(id.replace('ayah-', ''), 10);
            if (!isNaN(ayahNum) && activeAyahRef.current !== ayahNum) {
              activeAyahRef.current = ayahNum;

              // Save if user stays on this ayah for 2.5 seconds
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = setTimeout(async () => {
                try {
                  await saveLastRead(surahNumber, ayahNum);
                } catch (err) {
                  console.error('Failed to auto-save last read checkpoint:', err);
                }
              }, 2500);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-25% 0px -55% 0px', // Focused in middle of the screen
        threshold: 0.1,
      }
    );

    // Observe all ayah block divs
    const ayahElements = document.querySelectorAll('[id^="ayah-"]');
    ayahElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [surahNumber]);

  return null; // Side-effect logic component
}
