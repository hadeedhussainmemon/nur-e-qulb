'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, MapPin } from 'lucide-react';

export const SURAHS = [
  { number: 1, englishName: "Al-Fatihah", name: "الفاتحة", ayahs: 7 },
  { number: 2, englishName: "Al-Baqarah", name: "البقرة", ayahs: 286 },
  { number: 3, englishName: "Ali 'Imran", name: "آل عمران", ayahs: 200 },
  { number: 4, englishName: "An-Nisa", name: "النساء", ayahs: 176 },
  { number: 5, englishName: "Al-Ma'idah", name: "المائدة", ayahs: 120 },
  { number: 6, englishName: "Al-An'am", name: "الأنعام", ayahs: 165 },
  { number: 7, englishName: "Al-A'raf", name: "الأعراف", ayahs: 206 },
  { number: 8, englishName: "Al-Anfal", name: "الأنفال", ayahs: 75 },
  { number: 9, englishName: "At-Tawbah", name: "التوبة", ayahs: 129 },
  { number: 10, englishName: "Yunus", name: "يونس", ayahs: 109 },
  { number: 11, englishName: "Hud", name: "هود", ayahs: 123 },
  { number: 12, englishName: "Yusuf", name: "يوسف", ayahs: 111 },
  { number: 13, englishName: "Ar-Ra'd", name: "الرعد", ayahs: 43 },
  { number: 14, englishName: "Ibrahim", name: "ابراهيم", ayahs: 52 },
  { number: 15, englishName: "Al-Hijr", name: "الحجر", ayahs: 99 },
  { number: 16, englishName: "An-Nahl", name: "النحل", ayahs: 128 },
  { number: 17, englishName: "Al-Isra", name: "الإسراء", ayahs: 111 },
  { number: 18, englishName: "Al-Kahf", name: "الكهف", ayahs: 110 },
  { number: 19, englishName: "Maryam", name: "مريم", ayahs: 98 },
  { number: 20, englishName: "Ta-Ha", name: "طه", ayahs: 135 },
  { number: 21, englishName: "Al-Anbiya", name: "الأنبياء", ayahs: 112 },
  { number: 22, englishName: "Al-Hajj", name: "الحج", ayahs: 78 },
  { number: 23, englishName: "Al-Mu'minun", name: "المؤمنون", ayahs: 118 },
  { number: 24, englishName: "An-Nur", name: "النور", ayahs: 64 },
  { number: 25, englishName: "Al-Furqan", name: "الفرقان", ayahs: 77 },
  { number: 26, englishName: "Ash-Shu'ara", name: "الشعراء", ayahs: 227 },
  { number: 27, englishName: "An-Naml", name: "النمل", ayahs: 93 },
  { number: 28, englishName: "Al-Qasas", name: "القصص", ayahs: 88 },
  { number: 29, englishName: "Al-'Ankabut", name: "العنكبوت", ayahs: 69 },
  { number: 30, englishName: "Ar-Rum", name: "الروم", ayahs: 60 },
  { number: 31, englishName: "Luqman", name: "لقمان", ayahs: 34 },
  { number: 32, englishName: "As-Sajdah", name: "السجدة", ayahs: 30 },
  { number: 33, englishName: "Al-Ahzab", name: "الأحزاب", ayahs: 73 },
  { number: 34, englishName: "Saba", name: "سبأ", ayahs: 54 },
  { number: 35, englishName: "Fatir", name: "فاطر", ayahs: 45 },
  { number: 36, englishName: "Ya-Sin", name: "يس", ayahs: 83 },
  { number: 37, englishName: "As-Saffat", name: "الصافات", ayahs: 182 },
  { number: 38, englishName: "Sad", name: "ص", ayahs: 88 },
  { number: 39, englishName: "Az-Zumar", name: "الزمر", ayahs: 75 },
  { number: 40, englishName: "Ghafir", name: "غافر", ayahs: 85 },
  { number: 41, englishName: "Fussilat", name: "فصلت", ayahs: 54 },
  { number: 42, englishName: "Ash-Shura", name: "الشورى", ayahs: 53 },
  { number: 43, englishName: "Az-Zukhruf", name: "الزخرف", ayahs: 89 },
  { number: 44, englishName: "Ad-Dukhan", name: "الدخان", ayahs: 59 },
  { number: 45, englishName: "Al-Jathiyah", name: "الجاثية", ayahs: 37 },
  { number: 46, englishName: "Al-Ahqaf", name: "الأحقاف", ayahs: 35 },
  { number: 47, englishName: "Muhammad", name: "محمد", ayahs: 38 },
  { number: 48, englishName: "Al-Fath", name: "الفتح", ayahs: 29 },
  { number: 49, englishName: "Al-Hujurat", name: "الحجرات", ayahs: 18 },
  { number: 50, englishName: "Qaf", name: "ق", ayahs: 45 },
  { number: 51, englishName: "Adh-Dhariyat", name: "الذاريات", ayahs: 60 },
  { number: 52, englishName: "At-Tur", name: "الطور", ayahs: 49 },
  { number: 53, englishName: "An-Najm", name: "النجم", ayahs: 62 },
  { number: 54, englishName: "Al-Qamar", name: "القمر", ayahs: 55 },
  { number: 55, englishName: "Ar-Rahman", name: "الرحمن", ayahs: 78 },
  { number: 56, englishName: "Al-Waqi'ah", name: "الواقعة", ayahs: 96 },
  { number: 57, englishName: "Al-Hadid", name: "الحديد", ayahs: 29 },
  { number: 58, englishName: "Al-Mujadilah", name: "المجادلة", ayahs: 22 },
  { number: 59, englishName: "Al-Hashr", name: "الحشر", ayahs: 24 },
  { number: 60, englishName: "Al-Mumtahanah", name: "الممتحنة", ayahs: 13 },
  { number: 61, englishName: "As-Saff", name: "الصف", ayahs: 14 },
  { number: 62, englishName: "Al-Jumu'ah", name: "الجمعة", ayahs: 11 },
  { number: 63, englishName: "Al-Munafiqun", name: "المنافقون", ayahs: 11 },
  { number: 64, englishName: "At-Taghabun", name: "التغابن", ayahs: 18 },
  { number: 65, englishName: "At-Talaq", name: "الطلاق", ayahs: 12 },
  { number: 66, englishName: "At-Tahrim", name: "التحريم", ayahs: 12 },
  { number: 67, englishName: "Al-Mulk", name: "الملك", ayahs: 30 },
  { number: 68, englishName: "Al-Qalam", name: "القلم", ayahs: 52 },
  { number: 69, englishName: "Al-Haqqah", name: "الحاقة", ayahs: 52 },
  { number: 70, englishName: "Al-Ma'arij", name: "المعارج", ayahs: 44 },
  { number: 71, englishName: "Nuh", name: "نوح", ayahs: 28 },
  { number: 72, englishName: "Al-Jinn", name: "الجن", ayahs: 28 },
  { number: 73, englishName: "Al-Muzzammil", name: "المزمل", ayahs: 20 },
  { number: 74, englishName: "Al-Muddaththir", name: "المدثر", ayahs: 56 },
  { number: 75, englishName: "Al-Qiyamah", name: "القيامة", ayahs: 40 },
  { number: 76, englishName: "Al-Insan", name: "الإنسان", ayahs: 31 },
  { number: 77, englishName: "Al-Mursalat", name: "المرسلات", ayahs: 50 },
  { number: 78, englishName: "An-Naba", name: "النبأ", ayahs: 40 },
  { number: 79, englishName: "An-Nazi'at", name: "النازعات", ayahs: 46 },
  { number: 80, englishName: "'Abasa", name: "عبس", ayahs: 42 },
  { number: 81, englishName: "At-Takwir", name: "التكوير", ayahs: 29 },
  { number: 82, englishName: "Al-Infitar", name: "الانفطار", ayahs: 19 },
  { number: 83, englishName: "Al-Mutaffifin", name: "المطففين", ayahs: 36 },
  { number: 84, englishName: "Al-Inshiqaq", name: "الانشقاق", ayahs: 25 },
  { number: 85, englishName: "Al-Buruj", name: "البروج", ayahs: 22 },
  { number: 86, englishName: "At-Tariq", name: "الطارق", ayahs: 17 },
  { number: 87, englishName: "Al-A'la", name: "الأعلى", ayahs: 19 },
  { number: 88, englishName: "Al-Ghashiyah", name: "الغاشية", ayahs: 26 },
  { number: 89, englishName: "Al-Fajr", name: "الفجر", ayahs: 30 },
  { number: 90, englishName: "Al-Balad", name: "البلد", ayahs: 20 },
  { number: 91, englishName: "Ash-Shams", name: "الشمس", ayahs: 15 },
  { number: 92, englishName: "Al-Layl", name: "الليل", ayahs: 21 },
  { number: 93, englishName: "Ad-Duha", name: "الضحى", ayahs: 11 },
  { number: 94, englishName: "Ash-Sharh", name: "الشرح", ayahs: 8 },
  { number: 95, englishName: "At-Tin", name: "التين", ayahs: 8 },
  { number: 96, englishName: "Al-'Alaq", name: "العلق", ayahs: 19 },
  { number: 97, englishName: "Al-Qadr", name: "القدر", ayahs: 5 },
  { number: 98, englishName: "Al-Bayyinah", name: "البينة", ayahs: 8 },
  { number: 99, englishName: "Az-Zalzalah", name: "الزلزلة", ayahs: 8 },
  { number: 100, englishName: "Al-'Adiyat", name: "العاديات", ayahs: 11 },
  { number: 101, englishName: "Al-Qari'ah", name: "القارعة", ayahs: 11 },
  { number: 102, englishName: "At-Takathur", name: "التكاثر", ayahs: 8 },
  { number: 103, englishName: "Al-'Asr", name: "العصر", ayahs: 3 },
  { number: 104, englishName: "Al-Humazah", name: "الهمزة", ayahs: 9 },
  { number: 105, englishName: "Al-Fil", name: "الفيل", ayahs: 5 },
  { number: 106, englishName: "Quraysh", name: "قريش", ayahs: 4 },
  { number: 107, englishName: "Al-Ma'un", name: "الماعون", ayahs: 7 },
  { number: 108, englishName: "Al-Kawthar", name: "الكوثر", ayahs: 3 },
  { number: 109, englishName: "Al-Kafirun", name: "الكافرون", ayahs: 6 },
  { number: 110, englishName: "An-Nasr", name: "النصر", ayahs: 3 },
  { number: 111, englishName: "Al-Masad", name: "المسد", ayahs: 5 },
  { number: 112, englishName: "Al-Ikhlas", name: "الإخلاص", ayahs: 4 },
  { number: 113, englishName: "Al-Falaq", name: "الفلق", ayahs: 5 },
  { number: 114, englishName: "An-Nas", name: "الناس", ayahs: 6 }
];

interface QuranNavigatorProps {
  currentSurahNumber?: number;
  currentAyahNumber?: number;
}

export function QuranNavigator({ currentSurahNumber, currentAyahNumber }: QuranNavigatorProps) {
  const router = useRouter();
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(currentSurahNumber || 1);
  const [selectedAyahNum, setSelectedAyahNum] = useState<number>(currentAyahNumber || 1);

  const activeSurah = SURAHS.find(s => s.number === selectedSurahNum) || SURAHS[0];

  // Update selected surah when prop changes
  useEffect(() => {
    if (currentSurahNumber) {
      setSelectedSurahNum(currentSurahNumber);
    }
  }, [currentSurahNumber]);

  // Update selected ayah when prop changes
  useEffect(() => {
    if (currentAyahNumber) {
      setSelectedAyahNum(currentAyahNumber);
    }
  }, [currentAyahNumber]);

  const handleSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const num = parseInt(e.target.value, 10);
    setSelectedSurahNum(num);
    setSelectedAyahNum(1); // Reset to first Ayah of new Surah
  };

  const handleAyahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAyahNum(parseInt(e.target.value, 10));
  };

  const handleNavigate = () => {
    router.push(`/quran/${selectedSurahNum}#ayah-${selectedAyahNum}`);
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20 dark:border-emerald-500/10 shadow-sm backdrop-blur-md">
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Quick Navigator</h4>
            <p className="text-[10px] text-muted-foreground">Jump to any Verse instantly</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Surah Dropdown */}
          <div className="flex-1 sm:flex-initial min-w-[150px]">
            <select
              value={selectedSurahNum}
              onChange={handleSurahChange}
              className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.englishName} ({s.name})
                </option>
              ))}
            </select>
          </div>

          {/* Ayah Dropdown */}
          <div className="w-[100px]">
            <select
              value={selectedAyahNum}
              onChange={handleAyahChange}
              className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: activeSurah.ayahs }, (_, i) => i + 1).map((aNum) => (
                <option key={aNum} value={aNum}>
                  Ayah {aNum}
                </option>
              ))}
            </select>
          </div>

          {/* Go Button */}
          <Button
            onClick={handleNavigate}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md shadow-emerald-500/15"
          >
            Go to Verse
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
