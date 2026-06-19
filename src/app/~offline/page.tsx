import React from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Offline - Nur E Qalbb',
};

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-8 border border-slate-200 dark:border-slate-800">
        <WifiOff className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">You are offline</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        It looks like you've lost your internet connection. We couldn't find a cached version of this page. 
        However, you can still access your previously visited Quran Surahs and Hadith collections!
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700">
            Go to Dashboard
          </Button>
        </Link>
        <Link href="/quran">
          <Button variant="outline">
            Read Quran
          </Button>
        </Link>
      </div>
    </div>
  );
}
