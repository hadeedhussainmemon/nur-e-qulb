'use client';

import * as React from 'react';
import { Menu, Moon, Sun, Bell, LogOut, Download, X, Clock, Check, Heart, BookOpen, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTheme } from 'next-themes';
import { VoiceSearch } from '@/components/layout/VoiceSearch';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/actions/notificationActions';
import { usePWAStore } from '@/store/usePWAStore';

// Helper to format relative time ago
function formatTimeAgo(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

// Helper to map notification type to Lucide icons and premium colors
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'prayer':
      return { icon: Clock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' };
    case 'wazeefah':
      return { icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' };
    case 'ayah':
      return { icon: BookOpen, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' };
    case 'hadith':
      return { icon: BookMarked, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    case 'system':
    default:
      return { icon: Bell, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' };
  }
};

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { deferredPrompt, isStandalone, triggerInstall } = usePWAStore();
  const notifRef = React.useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Auto-minimize/close mobile sidebar on page navigation
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const [notifications, setNotifications] = React.useState<any[]>([]);

  const loadNotifications = React.useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await getUserNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, [session]);

  // Load and poll notifications
  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleInstall = async () => {
    await triggerInstall();
  };

  // Close notification panel on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await markAllNotificationsRead();
      loadNotifications();
    } catch (e) {
      console.error('Failed to mark all notifications read:', e);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      await markNotificationRead(id);
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const username = session?.user?.name || 'User';
  const gender = (session?.user as any)?.gender || 'other';

  const getGenderBadge = (g: string) => {
    if (g === 'female') return 'border-rose-500/30 text-rose-400 bg-rose-500/10';
    if (g === 'male') return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
    return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex items-center justify-between px-3 md:px-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/40 h-14 md:h-16 shrink-0">
      {/* Mobile menu trigger */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        {/* @ts-expect-error React 19 type compatibility */}
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden text-slate-600 dark:text-zinc-400">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 border-r-0 max-w-[280px] bg-white dark:bg-slate-900">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile: App title */}
      <span className="md:hidden text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
        Nur E Qalbb
      </span>

      {/* Right side controls */}
      <div className="flex items-center gap-1 md:gap-2 ml-auto">

        {/* PWA Install button — only show if not installed */}
        {!isStandalone && deferredPrompt && (
          <button
            onClick={handleInstall}
            title="Install App"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-xs font-semibold border border-emerald-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        <VoiceSearch />

        {/* Notification Bell with dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => {
                    const iconConfig = getNotificationIcon(n.type);
                    const Icon = iconConfig.icon;
                    return (
                      <div
                        key={n._id}
                        onClick={() => handleMarkOneRead(n._id)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/10',
                          n.isRead ? 'opacity-60' : 'bg-slate-50 dark:bg-slate-800/30'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', iconConfig.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug break-words">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{formatTimeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1" />}
                      </div>
                    );
                  })
                )}
              </div>
              {unreadCount > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-left">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
        >
          <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User profile + logout (desktop only) */}
        {session && (
          <div className="hidden md:flex items-center gap-2 ml-1 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate leading-none">{username}</p>
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider mt-0.5 inline-block', getGenderBadge(gender))}>
                {gender === 'female' ? '♀ female' : gender === 'male' ? '♂ male' : 'other'}
              </span>
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: '/login' })}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
