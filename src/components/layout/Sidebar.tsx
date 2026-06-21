'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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
} from 'lucide-react';

const routes = [
  { label: 'Home',             icon: LayoutDashboard, href: '/',         color: 'text-sky-500'     },
  { label: 'Nimaz',            icon: Clock,           href: '/prayers',  color: 'text-emerald-500' },
  { label: 'Wazeefah',         icon: Heart,           href: '/wazeefahs',color: 'text-blue-400'    },
  { label: 'Quran',            icon: BookOpen,        href: '/quran',    color: 'text-teal-400'    },
  { label: 'Qibla',            icon: Compass,         href: '/qibla',    color: 'text-amber-500'   },
  { label: 'Hadith',           icon: BookMarked,      href: '/hadith',   color: 'text-rose-400'    },
  { label: 'Family',           icon: Users,           href: '/family',   color: 'text-indigo-400'  },
  { label: 'Tasbeeh',          icon: CircleDot,       href: '/tasbih',   color: 'text-purple-400'  },
  { label: 'Islamic Calendar', icon: Calendar,        href: '/calendar', color: 'text-violet-400'  },
  { label: 'Settings',         icon: Settings,        href: '/settings', color: 'text-slate-400'   },
];

export function Sidebar() {
  const pathname = usePathname();

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
        <div className="space-y-0.5">
          {routes.map((route) => (
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

        {/* Quote card */}
        <div className="mx-1 mt-3 p-3 bg-emerald-50 dark:bg-slate-950/30 border border-emerald-100 dark:border-emerald-500/10 rounded-xl relative overflow-hidden shrink-0">
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
      </nav>
    </div>
  );
}
