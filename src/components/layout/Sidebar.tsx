'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  Settings,
  Compass,
  Users,
  LogOut,
  Clock,
  BookMarked,
  Calendar,
  CircleDot,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

const routes = [
  {
    label: 'Landing Page',
    icon: LayoutDashboard,
    href: '/',
    color: 'text-sky-500',
  },
  {
    label: 'Nimaz',
    icon: Clock,
    href: '/prayers',
    color: 'text-emerald-500',
  },
  {
    label: 'Wazeefah',
    icon: Heart,
    href: '/wazeefahs',
    color: 'text-blue-400',
  },
  {
    label: 'Quran',
    icon: BookOpen,
    href: '/quran',
    color: 'text-teal-400',
  },
  {
    label: 'Qibla',
    icon: Compass,
    href: '/qibla',
    color: 'text-amber-500',
  },
  {
    label: 'Hadith',
    icon: BookMarked,
    href: '/hadith',
    color: 'text-rose-400',
  },
  {
    label: 'Family',
    icon: Users,
    href: '/family',
    color: 'text-indigo-400',
  },
  {
    label: 'Tasbeeh',
    icon: CircleDot,
    href: '/tasbih',
    color: 'text-purple-400',
  },
  {
    label: 'Islamic Calendar',
    icon: Calendar,
    href: '/calendar',
    color: 'text-violet-400',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    color: 'text-slate-500',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const username = session?.user?.name || 'User';
  const gender = (session?.user as any)?.gender || 'other';

  const getGenderBadge = (g: string) => {
    if (g === 'female') return 'border-rose-500/30 text-rose-400 bg-rose-500/10';
    if (g === 'male') return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
    return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
  };

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white dark:bg-slate-950 border-r border-slate-800/50">
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <Link href="/" className="flex items-center pl-3 mb-10">
          <div className="relative w-8 h-8 mr-4 flex items-center justify-center bg-emerald-600 rounded-lg shadow-lg">
            <span className="text-white font-bold text-xl leading-none">N</span>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
            Nur E Qalbb
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/5 rounded-lg transition-all',
                pathname === route.href ? 'bg-white/10 text-white font-semibold' : 'text-zinc-400'
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Profile Footer Section */}
      {session && (
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-semibold truncate leading-none mb-1 text-slate-200">{username}</p>
              <div className="flex items-center gap-1.5">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider', getGenderBadge(gender))}>
                  {gender === 'female' ? '♀ female' : gender === 'male' ? '♂ male' : 'other'}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
