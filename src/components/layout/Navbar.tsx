'use client';

import * as React from 'react';
import { Menu, Moon, Sun, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTheme } from 'next-themes';
import { VoiceSearch } from '@/components/layout/VoiceSearch';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const username = session?.user?.name || 'User';
  const gender = (session?.user as any)?.gender || 'other';

  const getGenderBadge = (g: string) => {
    if (g === 'female') return 'border-rose-500/30 text-rose-400 bg-rose-500/10';
    if (g === 'male') return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
    return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
  };

  return (
    <div className="flex items-center justify-between px-4 bg-background border-b border-slate-800/40 h-16 shrink-0">
      {/* Mobile menu trigger */}
      <Sheet>
        {/* @ts-expect-error React 19 type compatibility */}
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 border-r-0 max-w-72 bg-slate-900">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Spacer for desktop (pushes everything to the right) */}
      <div className="flex-1" />

      {/* Right side: icons + user profile */}
      <div className="flex items-center gap-2">
        <VoiceSearch />

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg hover:bg-slate-900 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-zinc-400 hover:text-white cursor-pointer"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User profile + logout (desktop only) */}
        {session && (
          <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-none">{username}</p>
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider mt-0.5 inline-block', getGenderBadge(gender))}>
                {gender === 'female' ? '♀ female' : gender === 'male' ? '♂ male' : 'other'}
              </span>
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: '/login' })}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0 cursor-pointer"
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
