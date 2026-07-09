'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { usePWAStore } from '@/store/usePWAStore';

const Sidebar = dynamic(() => import('@/components/layout/Sidebar').then(mod => mod.Sidebar), { ssr: true });
const Navbar = dynamic(() => import('@/components/layout/Navbar').then(mod => mod.Navbar), { ssr: true });
const BottomNav = dynamic(() => import('@/components/layout/BottomNav').then(mod => mod.BottomNav), { ssr: true });
const GlobalAudioPlayer = dynamic(() => import('@/components/quran/GlobalAudioPlayer').then(mod => mod.GlobalAudioPlayer), { ssr: false });
const WazeefahReminderEngine = dynamic(() => import('@/components/layout/WazeefahReminderEngine').then(mod => mod.WazeefahReminderEngine), { ssr: false });

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isSettingsPage = pathname === '/settings';

  const { setDeferredPrompt, setIsStandalone, setIsInstalled } = usePWAStore();
  const [isCookieChecked, setIsCookieChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);

  // Sync PWA Install Prompt & Standalone Mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const mode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!mode);
    };

    checkStandalone();

    const wasInstalled = localStorage.getItem('nurequlb_pwa_installed') === 'true';
    if (wasInstalled) {
      setIsInstalled(true);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      const alreadyInstalled = localStorage.getItem('nurequlb_pwa_installed') === 'true';
      if (!alreadyInstalled) {
        setDeferredPrompt(e);
      }
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [setDeferredPrompt, setIsStandalone, setIsInstalled]);

  // Sync session cookie exist check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie;
      const exists = cookies.includes('next-auth.session-token') || cookies.includes('__Secure-next-auth.session-token');
      setHasCookie(exists);
      setIsCookieChecked(true);
    }
  }, []);

  // Register Service Worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(err => console.error('Service Worker registration failed:', err));
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

  // Fade out and remove PWA Splash Screen once session load status resolves
  useEffect(() => {
    if (status !== 'loading') {
      if (status === 'authenticated') {
        localStorage.setItem('nurequlb_logged_in', 'true');
      } else {
        localStorage.removeItem('nurequlb_logged_in');
      }

      const splash = document.getElementById('pwa-splash');
      if (splash) {
        splash.style.opacity = '0';
        const timer = setTimeout(() => {
          splash.remove();
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (status === 'loading' && !session && (!isCookieChecked || hasCookie)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isAuthPage || (pathname === '/' && (status === 'unauthenticated' || (status === 'loading' && isCookieChecked && !hasCookie)))) {
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
