import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked } from 'lucide-react';
import { fetchRandomHadith } from '@/app/actions/hadithActions';

export async function DailyHadithWidget() {
  const data = await fetchRandomHadith('bukhari'); // Default to Bukhari for daily widget

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Unable to load Daily Hadith.
        </CardContent>
      </Card>
    );
  }

  const { metadata, hadith } = data;

  return (
    <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-0 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BookMarked className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-indigo-300 flex items-center gap-2 text-sm font-medium">
          <BookMarked className="w-4 h-4" /> Daily Hadith
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <p className="text-lg leading-relaxed text-indigo-50">
          "{hadith.text}"
        </p>
        <div className="pt-4 border-t border-indigo-800/50 flex justify-between items-center text-sm text-indigo-200">
          <span>{metadata.name} (Hadith {hadith.hadithnumber})</span>
          {hadith.grades && hadith.grades.length > 0 && (
            <span className="bg-indigo-950 px-2 py-1 rounded-md text-xs font-semibold border border-indigo-800">
              {hadith.grades[0].grade}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
