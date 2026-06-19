import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { fetchRandomAyah } from '@/app/actions/quranActions';

export async function DailyAyahWidget() {
  const data = await fetchRandomAyah();

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Unable to load Daily Ayah.
        </CardContent>
      </Card>
    );
  }

  const { arabic, english } = data;

  return (
    <Card className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-0 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-emerald-300 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4" /> Daily Ayah
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <p className="text-2xl md:text-3xl font-arabic leading-loose text-right" style={{ fontFamily: 'Amiri, serif' }}>
          {arabic.text}
        </p>
        <p className="text-emerald-50 leading-relaxed">
          "{english.text}"
        </p>
        <div className="pt-4 border-t border-emerald-800/50 flex justify-between items-center text-sm text-emerald-200">
          <span>Surah {arabic.surah.englishName} ({arabic.surah.number}:{arabic.numberInSurah})</span>
        </div>
      </CardContent>
    </Card>
  );
}
