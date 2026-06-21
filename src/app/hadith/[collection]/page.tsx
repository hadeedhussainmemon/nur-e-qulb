'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useParams } from 'next/navigation';

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

export default function HadithCollectionPage() {
  const params = useParams();
  const collection = params.collection as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchHadithCategoriesClient(collection);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load categories client-side:', err);
      } finally {
        setLoading(false);
      }
    }
    if (collection) {
      loadCategories();
    }
  }, [collection]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Loading book index...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center mt-20 text-rose-500 font-medium">
        Error loading Hadith categories. Please check your network connection.
      </div>
    );
  }

  const { metadata, sections, sectionDetails } = data;
  
  // Transform the sections object into an array for rendering
  const categories = Object.keys(sections)
    .filter(key => sections[key] && sections[key].trim() !== '') // Remove empty names
    .map(key => ({
      bookNumber: key,
      name: sections[key],
      details: sectionDetails ? sectionDetails[key] : null
    }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32">
      <div className="text-center space-y-4 py-8 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-600 dark:text-emerald-400">
          {metadata.name}
        </h1>
        <p className="text-muted-foreground text-lg">Browse by Book (Kitab)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link href={`/hadith/${collection}/${category.bookNumber}`} key={category.bookNumber}>
            <Card className="hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer h-full border-slate-200 dark:border-slate-800">
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {category.name}
                    </h3>
                    {category.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Hadiths: {category.details.hadithnumber_first} - {category.details.hadithnumber_last}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-3" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
