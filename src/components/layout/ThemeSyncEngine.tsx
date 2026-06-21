'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateUserLocation } from '@/app/actions/authActions';

export function applyTheme(theme: string) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  
  root.classList.remove('theme-gold', 'theme-rose', 'theme-indigo');
  if (body) {
    body.classList.remove('theme-gold', 'theme-rose', 'theme-indigo');
  }
  
  if (theme && theme !== 'default') {
    root.classList.add(`theme-${theme}`);
    if (body) {
      body.classList.add(`theme-${theme}`);
    }
  }
}

export function ThemeSyncEngine() {
  const { data: session, update: updateSession } = useSession();

  // Load from localStorage immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('nur-theme') || 'default';
    applyTheme(savedTheme);
  }, []);

  // Sync theme from active session config directly (fast 0ms sync)
  useEffect(() => {
    if (!session) return;
    const sessionTheme = (session.user as any)?.settings?.theme;
    if (sessionTheme) {
      localStorage.setItem('nur-theme', sessionTheme);
      applyTheme(sessionTheme);
    }
  }, [session]);

  // Auto-detect and recheck location once per tab/browser session on startup
  useEffect(() => {
    if (!session) return;

    const hasChecked = sessionStorage.getItem('nur_location_checked');
    if (hasChecked === 'true') return;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding using OpenStreetMap Nominatim
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            if (!res.ok) throw new Error('Failed to fetch address');
            const data = await res.json();

            const newCity = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const newCountry = data.address.country || '';

            if (newCity) {
              const result = await updateUserLocation(newCity, newCountry);
              if (result.success) {
                sessionStorage.setItem('nur_location_checked', 'true');
                await updateSession();
              }
            }
          } catch (e) {
            console.error('Failed to auto-detect location on startup:', e);
          }
        },
        (error) => {
          console.error('Location access denied/unavailable on startup:', error);
        }
      );
    }
  }, [session, updateSession]);

  return null;
}

