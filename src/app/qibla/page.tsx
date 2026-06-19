'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass as CompassIcon, Map, Navigation } from 'lucide-react';
import { QiblaCompass } from '@/components/qibla/QiblaCompass';

// Dynamically import map with SSR disabled to prevent crashes from window reference
const QiblaMap = dynamic(() => import('@/components/qibla/QiblaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
      <p className="text-muted-foreground animate-pulse text-sm">Loading Geodesic Map Engine...</p>
    </div>
  ),
});

export default function QiblaPage() {
  const [activeTab, setActiveTab] = useState<'compass' | 'map'>('compass');

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32">
      <div className="text-center space-y-4 py-8 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CompassIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-outfit">Qibla Finder</h1>
        <p className="text-muted-foreground text-sm">Find the direction of the Kaaba from anywhere in the world.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('compass')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'compass'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" /> Live Compass
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'map'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          <Map className="w-4 h-4" /> Interactive Map
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm">
        {activeTab === 'compass' ? (
          <QiblaCompass />
        ) : (
          <QiblaMap />
        )}
      </div>
    </div>
  );
}
