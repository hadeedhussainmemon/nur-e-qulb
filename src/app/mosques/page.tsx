'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Dynamically import the map component with SSR disabled
// Leaflet uses the window object heavily, so it will crash if rendered on the server
const MosqueMap = dynamic(() => import('@/components/mosques/MosqueMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
      <p className="text-muted-foreground animate-pulse">Loading Maps Engine...</p>
    </div>
  )
});

export default function MosquesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">Mosque Finder</h1>
          <p className="text-muted-foreground">Find local Masjids near your current location.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 p-2 md:p-4 rounded-2xl shadow-sm border">
        <MosqueMap />
      </div>
    </div>
  );
}
