'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Heart, Share2, Loader2, Check } from 'lucide-react';
import { toggleHadithBookmark, isHadithBookmarked } from '@/app/actions/bookmarkActions';
import { useSession } from 'next-auth/react';
import { ShareCard } from '@/components/quran/ShareCard';

interface HadithBlockProps {
  collectionId: string;
  bookNumber: string;
  hadithNumber: string;
  text: string;
  grades: { name: string; grade: string }[];
}

function splitArabicAndEnglish(text: string) {
  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(text)) {
    return {
      arabic: "قَالَ رَسُولُ اللَّهِ ﷺ",
      english: text
    };
  }
  
  // Split by line and partition
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const arabicLines = lines.filter(line => arabicRegex.test(line));
  const englishLines = lines.filter(line => !arabicRegex.test(line));
  
  if (arabicLines.length > 0 && englishLines.length > 0) {
    return {
      arabic: arabicLines.join('\n'),
      english: englishLines.join('\n')
    };
  }
  
  return {
    arabic: "قَالَ رَسُولُ اللَّهِ ﷺ",
    english: text
  };
}

export function HadithBlock({
  collectionId,
  bookNumber,
  hadithNumber,
  text,
  grades,
}: HadithBlockProps) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    async function checkBookmark() {
      if (session) {
        const isBook = await isHadithBookmarked(collectionId, hadithNumber);
        setBookmarked(isBook);
      }
    }
    checkBookmark();
  }, [collectionId, hadithNumber, session]);

  const handleToggleBookmark = async () => {
    if (!session) return;
    setLoading(true);
    setBookmarked(!bookmarked);

    try {
      const result = await toggleHadithBookmark(collectionId, bookNumber || '1', hadithNumber);
      if (!result.success) {
        setBookmarked(bookmarked); // Revert
      }
    } catch (err) {
      console.error(err);
      setBookmarked(bookmarked); // Revert
    } finally {
      setLoading(false);
    }
  };

  const getGradeStyle = (grade: string) => {
    const g = grade.toLowerCase();
    if (g.includes('sahih')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/10';
    if (g.includes('hasan')) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-500/10';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400';
  };

  const { arabic, english } = splitArabicAndEnglish(text);

  const sanitizeHadithText = (str: string) => {
    if (!str) return '';
    const quoteCount = (str.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      return str.trim() + '"';
    }
    return str;
  };

  const sanitizedEnglish = sanitizeHadithText(english);
  const sanitizedText = sanitizeHadithText(text);

  return (
    <>
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
          <span className="font-bold text-emerald-600 dark:text-emerald-500">
            Hadith {hadithNumber}
          </span>
          <div className="flex items-center gap-1">
            {/* Bookmark */}
            <Button
              onClick={handleToggleBookmark}
              disabled={loading}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${bookmarked ? "text-amber-500 bg-amber-500/10" : "text-slate-400 hover:text-amber-500"}`}
              title={bookmarked ? "Unbookmark Hadith" : "Bookmark Hadith"}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
            </Button>

            {/* Share */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsShareOpen(true)}
              className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800" 
              title="Share Hadith"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div className="text-left">
            <p className="text-base md:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              {sanitizedText}
            </p>
          </div>

          {grades && grades.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground uppercase tracking-wider font-semibold">Authenticity Grade:</span>
              <div className="flex flex-wrap gap-2">
                {grades.map((grade: any, i: number) => (
                  <span key={i} className={`px-2.5 py-1 rounded-full font-medium ${getGradeStyle(grade.grade)}`}>
                    {grade.grade} ({grade.name})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isShareOpen && (
        <ShareCard 
          arabicText={arabic}
          translationText={sanitizedEnglish}
          reference={`${collectionId.toUpperCase()} Hadith ${hadithNumber}`}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </>
  );
}

