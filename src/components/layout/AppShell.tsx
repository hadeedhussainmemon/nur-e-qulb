'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { GlobalAudioPlayer } from '@/components/quran/GlobalAudioPlayer';
import { WazeefahReminderEngine } from '@/components/layout/WazeefahReminderEngine';
import { BottomNav } from '@/components/layout/BottomNav';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isSettingsPage = pathname === '/settings';

  // Register Service Worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('Service Worker registration failed:', err));
    }
  }, []);

  // Redirect first-time users to settings
  useEffect(() => {
    if (
      status === 'authenticated' &&
      !isAuthPage &&
      !isSettingsPage &&
      (session?.user as any)?.onboardingCompleted === false
    ) {
      router.replace('/settings?onboarding=true');
    }
  }, [status, session, isAuthPage, isSettingsPage, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isAuthPage || (pathname === '/' && status === 'unauthenticated')) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950">
        {children}
      </main>
    );
  }

  return (
    <div className="h-full relative bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar — fixed left */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/50">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className="md:pl-64 flex flex-col min-h-screen">
        <Navbar />
        {/* Content: extra bottom padding on mobile for BottomNav */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      <GlobalAudioPlayer />
      <WazeefahReminderEngine />
      <BottomNav />
    </div>
  );
}
