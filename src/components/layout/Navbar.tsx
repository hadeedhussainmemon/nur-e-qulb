'use client';

import * as React from 'react';
import { Menu, Moon, Sun, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTheme } from 'next-themes';
import { VoiceSearch } from '@/components/layout/VoiceSearch';

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between p-4 bg-background border-b border-slate-800/40 h-16 shrink-0">
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

      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center relative w-80">
        <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search Quran, Hadith..." 
          className="w-full bg-slate-900/40 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <VoiceSearch />
        
        {/* Notification Bell with red dot */}
        <button className="relative p-2 rounded-lg hover:bg-slate-900 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* Theme toggle switch */}
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
      </div>
    </div>
  );
}
