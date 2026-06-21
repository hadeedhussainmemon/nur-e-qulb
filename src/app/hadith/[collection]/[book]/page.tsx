'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HadithBlock } from '@/components/hadith/HadithBlock';
import { ArrowLeft, Loader2 } from 'lucide-react';

const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

async function fetchHadithCategoriesClient(collection: string) {
  const res = await fetch(`${BASE_URL}/eng-${collection}.json`);
  if (!res.ok) throw new Error(`Failed to fetch categories for ${collection}`);
  const data = await res.json();
  return {
    metadata: data.metadata,
    sections: data.metadata.sections || data.metadata.section,
    sectionDetails: data.metadata.sectionDetails,
  };
}

async function fetchHadithsByCategoryClient(collection: string, bookNumber: string) {
  const res = await fetch(`${BASE_URL}/eng-${collection}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${collection} book ${bookNumber}`);
  const data = await res.json();
  const filteredHadiths = data.hadiths.filter((h: any) => {
    const bNum = h.booknumber || (h.reference && h.reference.book);
    return bNum && bNum.toString() === bookNumber.toString();
  });
  return {
    metadata: data.metadata,
    hadiths: filteredHadiths,
  };
}

import { useParams } from 'next/navigation';

export default function HadithCategoryPage() {
  const params = useParams();
  const collection = params.collection as string;
  const book = params.book as string;

  const [data, setData] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [hadithRes, catRes] = await Promise.all([
          fetchHadithsByCategoryClient(collection, book),
          fetchHadithCategoriesClient(collection)
        ]);
        if (hadithRes && catRes) {
          setData(hadithRes);
          setCategoriesData(catRes);
        }
      } catch (err) {
        console.error('Failed to load Hadiths client-side:', err);
      } finally {
        setLoading(false);
      }
    }
    if (collection && book) {
      loadData();
    }
  }, [collection, book]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Opening Book chapter...</p>
      </div>
    );
  }

  if (!data || !categoriesData) {
    return (
      <div className="flex justify-center mt-20 text-rose-500 font-medium">
        Error loading Hadiths for this category. Please check your network connection.
      </div>
    );
  }

  const { metadata, hadiths } = data;
  const bookName = categoriesData.sections[book] || `Book ${book}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-emerald-100 dark:border-emerald-900">
        <Link href={`/hadith/${collection}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {bookName}
          </h1>
          <p className="text-muted-foreground mt-1">{metadata.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        {hadiths.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hadiths found in this category.
          </div>
        ) : (
          hadiths.map((hadith: any) => (
            <HadithBlock
              key={hadith.hadithnumber}
              collectionId={collection}
              bookNumber={hadith.booknumber || (hadith.reference && hadith.reference.book) || book}
              hadithNumber={hadith.hadithnumber}
              text={hadith.text}
              grades={hadith.grades || []}
            />
          ))
        )}
      </div>
    </div>
  );
}
