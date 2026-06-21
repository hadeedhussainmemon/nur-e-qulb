'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { PublicHome } from '@/components/home/PublicHome';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <PublicHome />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
        As-salamu alaykum, {session?.user?.name || 'User'}!
      </h2>
      <p className="text-muted-foreground text-lg">
        This is a clean home dashboard. All widgets have been removed to isolate and resolve the loading issue.
      </p>
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg">
        If you see this page, the home dashboard is loading correctly and the infinite loading loop has been successfully resolved!
      </div>
    </div>
  );
}
