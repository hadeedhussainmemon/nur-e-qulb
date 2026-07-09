'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, MoonStar } from 'lucide-react';

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

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const hasPassed15s = useRef(false);
  const [isCookieChecked, setIsCookieChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);

  // Sync PWA Install Prompt after 15 seconds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const checkAndShow = (prompt: any) => {
      const dismissed = localStorage.getItem('nurequlb_install_prompt_dismissed');
      if (!dismissed && prompt && hasPassed15s.current) {
        setShowAutoPrompt(true);
      }
    };

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handleCustomEvent = (e: any) => {
      const promptEvent = e.detail;
      setDeferredPrompt(promptEvent);
      checkAndShow(promptEvent);
    };
    window.addEventListener('deferredpromptready', handleCustomEvent as any);

    const timer = setTimeout(() => {
      hasPassed15s.current = true;
      const activePrompt = (window as any).deferredPrompt;
      if (activePrompt) {
        setDeferredPrompt(activePrompt);
        checkAndShow(activePrompt);
      }
    }, 15000);

    return () => {
      window.removeEventListener('deferredpromptready', handleCustomEvent as any);
      clearTimeout(timer);
    };
  }, []);

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

  if (status === 'loading' && !session && (!isCookieChecked || hasCookie)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-955">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isAuthPage || (pathname === '/' && (status === 'unauthenticated' || (status === 'loading' && isCookieChecked && !hasCookie)))) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-955">
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

      {/* 15-Second PWA Install Auto-Prompt Overlay Sheet */}
      {showAutoPrompt && (
        <div className="fixed bottom-20 md:bottom-6 right-0 md:right-6 left-0 md:left-auto z-[999] px-4 md:px-0 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-emerald-500/30 text-white p-5 rounded-2xl md:w-80 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                  <MoonStar className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Install Nur E Qalbb</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Get a standalone, fast, and distraction-free app experience.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('nurequlb_install_prompt_dismissed', 'true');
                  setShowAutoPrompt(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-transparent border border-slate-700 hover:bg-white/5 text-slate-300 transition-colors cursor-pointer"
              >
                Later
              </button>
              <button
                onClick={async () => {
                  const prompt = (window as any).deferredPrompt || deferredPrompt;
                  if (prompt) {
                    prompt.prompt();
                    const { outcome } = await prompt.userChoice;
                    if (outcome === 'accepted') {
                      localStorage.setItem('nurequlb_install_prompt_dismissed', 'true');
                    }
                  }
                  setShowAutoPrompt(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors cursor-pointer border-0"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
