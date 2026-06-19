'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCurrentUser } from '@/app/actions/authActions';

export function applyTheme(theme: string) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('theme-gold', 'theme-rose', 'theme-indigo');
  if (theme && theme !== 'default') {
    root.classList.add(`theme-${theme}`);
  }
}

export function ThemeSyncEngine() {
  const { data: session } = useSession();

  // Load from localStorage immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('nur-theme') || 'default';
    applyTheme(savedTheme);
  }, []);

  // Fetch from DB if session is active to sync
  useEffect(() => {
    if (!session) return;

    async function syncThemeFromDb() {
      try {
        const user = await getCurrentUser();
        if (user?.settingsId?.theme) {
          const dbTheme = user.settingsId.theme;
          localStorage.setItem('nur-theme', dbTheme);
          applyTheme(dbTheme);
        }
      } catch (error) {
        console.error('Failed to sync theme from DB:', error);
      }
    }

    syncThemeFromDb();
  }, [session]);

  return null;
}
