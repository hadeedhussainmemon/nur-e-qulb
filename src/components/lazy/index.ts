'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded Mosque Map Component
 * Loads Leaflet (250KB+) only when component is actually needed
 */
export const LazyMosqueMap = dynamic(
  () => import('@/components/mosques/MosqueMap'),
  {
    ssr: false, // No server-side rendering (client-only library)
    loading: () => (
      <div className="w-full h-96 rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    ),
  }
);

/**
 * Lazy-loaded Global Audio Player
 * Splits audio player logic from main bundle
 */
export const LazyGlobalAudioPlayer = dynamic(
  () => import('@/components/quran/GlobalAudioPlayer'),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
    ),
  }
);

/**
 * Lazy-loaded Admin Dashboard
 * Reduces main bundle since most users aren't admins
 */
export const LazyAdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    ssr: true, // Can do SSR if data is available
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  }
);

/**
 * Lazy-loaded Theme Customizer
 * Heavy component with lots of UI controls
 */
export const LazyThemeCustomizer = dynamic(
  () => import('@/components/layout/ThemeCustomizer'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
    ),
  }
);
