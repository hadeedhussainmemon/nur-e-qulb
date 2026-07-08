'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  Settings,
  Compass,
  Users,
  Clock,
  BookMarked,
  Calendar,
  CircleDot,
  Calculator,
  BarChart3,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const routes = [
  { label: 'Home',             icon: LayoutDashboard, href: '/',         color: 'text-sky-500'     },
  { label: 'Namaz',            icon: Clock,           href: '/prayers',  color: 'text-emerald-500' },
  { label: 'My Month',         icon: BarChart3,       href: '/my-month', color: 'text-indigo-400'  },
  { label: 'Wazeefah',         icon: Heart,           href: '/wazeefahs',color: 'text-blue-400'    },
  { label: 'Quran',            icon: BookOpen,        href: '/quran',    color: 'text-teal-400'    },
  { label: 'Qibla',            icon: Compass,         href: '/qibla',    color: 'text-amber-500'   },
  { label: 'Hadith',           icon: BookMarked,      href: '/hadith',   color: 'text-rose-400'    },
  { label: 'Family',           icon: Users,           href: '/family',   color: 'text-indigo-400'  },
  { label: 'Tasbeeh',          icon: CircleDot,       href: '/tasbih',   color: 'text-purple-400'  },
  { label: 'Islamic Calendar', icon: Calendar,        href: '/calendar', color: 'text-violet-400'  },
  { label: 'Zakat',            icon: Calculator,      href: '/zakat',    color: 'text-amber-400'   },
  { label: 'Community',        icon: Users,           href: '/community',color: 'text-blue-500'    },
  { label: 'Settings',         icon: Settings,        href: '/settings', color: 'text-slate-400'   },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isInstallInfoOpen, setIsInstallInfoOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    let handleCustomEvent: (e: any) => void;

    if (typeof window !== 'undefined') {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
      }
      
      handleCustomEvent = (e: any) => {
        setDeferredPrompt(e.detail);
      };
      window.addEventListener('deferredpromptready', handleCustomEvent as any);

      const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
      const mobileCheck = /android|iphone|ipad|ipod/i.test(userAgent);
      setIsMobile(mobileCheck);
      setIsIOS(/iphone|ipad|ipod/i.test(userAgent));

      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone
      ) {
        setIsStandalone(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (typeof window !== 'undefined' && handleCustomEvent) {
        window.removeEventListener('deferredpromptready', handleCustomEvent as any);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallInfoOpen(true);
    }
  };

  const visibleRoutes = React.useMemo(() => {
    if (isAdmin) {
      return [
        ...routes,
        { label: 'Admin Console', icon: ShieldAlert, href: '/admin', color: 'text-rose-500 font-bold' }
      ];
    }
    return routes;
  }, [isAdmin]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-4 py-4 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 flex items-center justify-center shadow rounded-lg overflow-hidden shrink-0">
          <Image src="/logo.png" alt="Nur-e-Qulb Logo" width={32} height={32} className="object-cover" priority />
        </div>
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
          Nur E Qalbb
        </h1>
      </Link>

      {/* Nav routes */}
      <nav className="flex-1 px-2 py-2 flex flex-col justify-between overflow-hidden">
        <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-180px)]">
          {visibleRoutes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === route.href
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
              )}
            >
              <route.icon className={cn('h-4 w-4 shrink-0', route.color)} />
              <span className="truncate">{route.label}</span>
            </Link>
          ))}
        </div>

        <div className="shrink-0 space-y-2 mt-auto pt-2">
          {/* Install App Button */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border-0"
            >
              <Download className="w-3.5 h-3.5" /> {deferredPrompt ? 'Install Now' : (isMobile ? 'Install Guide' : 'Installation Guide')}
            </button>
          )}

          {/* Quote card */}
          <div className="p-3 bg-emerald-50 dark:bg-slate-950/30 border border-emerald-100 dark:border-emerald-500/10 rounded-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-[0.05] pointer-events-none text-emerald-500">
              <svg className="h-full w-full" viewBox="0 0 100 60" fill="currentColor">
                <path d="M 40 60 L 40 30 Q 40 10 55 10 Q 70 10 70 30 L 70 60 Z" />
              </svg>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed italic relative z-10">
              "Indeed, in the remembrance of Allah do hearts find rest."
            </p>
            <p className="text-[9px] text-emerald-500 dark:text-emerald-400 font-bold text-right mt-1 relative z-10">
              — Quran 13:28
            </p>
          </div>
        </div>
      </nav>

      {/* Manual PWA Install Instructions Dialog */}
      <Dialog open={isInstallInfoOpen} onOpenChange={setIsInstallInfoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5 animate-bounce" /> Install Nur-e-Qulb App
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Install Nur-e-Qulb on your device to enjoy a standalone, premium, distraction-free app experience.</p>
            
            {isMobile ? (
              <div className="space-y-3 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-850">
                {isIOS ? (
                  <>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Open Safari Share Menu:</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tap the Share button in Safari's bottom toolbar (the square box with an arrow pointing up).</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Add to Home Screen:</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Scroll down the share sheet options and select <span className="font-semibold">"Add to Home Screen"</span>.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Open Browser Menu:</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tap the browser menu button next to the address bar (usually three dots <span className="font-mono">...</span>).</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Install / Add to Home Screen:</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Select <span className="font-semibold">"Install app"</span> or <span className="font-semibold">"Add to Home screen"</span> from the list.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-850">
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">On Chrome / Edge:</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click the computer/install icon in the address bar (next to the bookmark star), or open the menu (<span className="font-mono">...</span>) and select <span className="font-semibold">"Install Nur E Qalbb"</span>.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">On Apple Safari (macOS):</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click the Share button in the browser toolbar, then select <span className="font-semibold">"Add to Dock"</span> or <span className="font-semibold">"Add to Home Screen"</span>.</p>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-[11px] text-muted-foreground italic text-center">Once installed, you can launch the app directly from your device home screen or app launcher.</p>
          </div>
          <DialogFooter className="pt-2">
            <Button onClick={() => setIsInstallInfoOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
