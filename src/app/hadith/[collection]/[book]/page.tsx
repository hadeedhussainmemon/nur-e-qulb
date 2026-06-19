import React from 'react';
import Link from 'next/link';
import { fetchHadithsByCategory, fetchHadithCategories } from '@/app/actions/hadithActions';
import { HadithBlock } from '@/components/hadith/HadithBlock';
import { ArrowLeft } from 'lucide-react';

export default async function HadithCategoryPage({ params }: { params: { collection: string, book: string } }) {
  const data = await fetchHadithsByCategory(params.collection, params.book);
  const categoriesData = await fetchHadithCategories(params.collection);

  if (!data || !categoriesData) {
    return (
      <div className="flex justify-center mt-20 text-rose-500 font-medium">
        Error loading Hadiths for this category.
      </div>
    );
  }

  const { metadata, hadiths } = data;
  const bookName = categoriesData.sections[params.book] || `Book ${params.book}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-emerald-100 dark:border-emerald-900">
        <Link href={`/hadith/${params.collection}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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
              collectionId={params.collection}
              bookNumber={hadith.booknumber || params.book}
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
