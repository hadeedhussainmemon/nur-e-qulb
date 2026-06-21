'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, BookOpen, CircleDot, Heart, User } from 'lucide-react';

const navItems = [
  { label: 'Home',     icon: Home,      href: '/'         },
  { label: 'Quran',    icon: BookOpen,  href: '/quran'    },
  { label: 'Tasbeeh',  icon: CircleDot, href: '/tasbih',  isFloating: true },
  { label: 'Wazeefah', icon: Heart,     href: '/wazeefahs'},
  { label: 'Profile',  icon: User,      href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md',
        'border-t border-slate-200 dark:border-slate-800',
        'shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isFloating) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div className={cn(
                  'w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-lg',
                  isActive
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-500'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  'text-[9px] font-bold tracking-wide mt-0.5',
                  isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'
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
              className="flex flex-col items-center justify-center flex-1 py-1 gap-1 group"
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-white'
                )} />
              </div>
              <span className={cn(
                'text-[9px] font-semibold tracking-wide transition-colors leading-none',
                isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
