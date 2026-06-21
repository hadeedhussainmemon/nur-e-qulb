'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, BookOpen, CircleDot, Heart, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      label: 'Quran',
      icon: BookOpen,
      href: '/quran',
    },
    {
      label: 'Tasbeeh',
      icon: CircleDot,
      href: '/tasbih',
      isFloating: true,
    },
    {
      label: 'Wazeefah',
      icon: Heart,
      href: '/wazeefahs',
    },
    {
      label: 'Profile',
      icon: User,
      href: '/settings',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-900 h-18 px-4 pb-safe flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isFloating) {
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative -top-3 flex flex-col items-center group cursor-pointer"
            >
              <div className={cn(
                "w-12 h-12 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-all",
                isActive 
                  ? "border-emerald-500 text-emerald-450 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                  : "border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[9px] font-semibold mt-0.5 tracking-wider transition-colors",
                isActive ? "text-emerald-400" : "text-zinc-500"
              )}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center w-12 h-10 group cursor-pointer"
          >
            <Icon className={cn(
              "w-5 h-5 transition-colors",
              isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-white"
            )} />
            <span className={cn(
              "text-[9px] font-semibold mt-1 tracking-wider transition-colors",
              isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-400"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
