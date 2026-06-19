'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { GlobalAudioPlayer } from '@/components/quran/GlobalAudioPlayer';
import { InstallPrompt } from '@/components/layout/InstallPrompt';
import { WazeefahReminderEngine } from '@/components/layout/WazeefahReminderEngine';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicLanding = pathname === '/' && status === 'unauthenticated';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // If it's a login/register page or the unauthenticated landing page, render without sidebar/navbar
  if (isAuthPage || isPublicLanding) {
    return (
      <main className="min-h-screen bg-background">
        {children}
      </main>
    );
  }

  // Render the full dashboard layout with Sidebar and Navbar
  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72 flex flex-col h-full bg-background">
        <InstallPrompt />
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          {children}
        </div>
      </main>
      <GlobalAudioPlayer />
      <WazeefahReminderEngine />
    </div>
  );
}
