import React from 'react';
import { fetchHadithsByCollection } from '@/app/actions/hadithActions';
import { HadithBlock } from '@/components/hadith/HadithBlock';

export default async function HadithCollectionPage({ params }: { params: { collection: string } }) {
  const data = await fetchHadithsByCollection(params.collection, 50); // Fetch first 50 hadiths for demo

  if (!data) {
    return (
      <div className="flex justify-center mt-20 text-red-500">
        Error loading Hadith collection.
      </div>
    );
  }

  const { metadata, hadiths } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-32">
      <div className="text-center space-y-4 py-8 border-b border-emerald-100 dark:border-emerald-900">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-600 dark:text-emerald-400">
          {metadata.name}
        </h1>
        <h2 className="text-xl font-medium font-arabic text-slate-500" style={{ fontFamily: 'Amiri, serif' }}>
          {metadata.name}
        </h2>
      </div>

      <div className="space-y-6">
        {hadiths.map((hadith: any) => (
          <HadithBlock
            key={hadith.hadithnumber}
            collectionId={params.collection}
            bookNumber={hadith.booknumber || '1'}
            hadithNumber={hadith.hadithnumber}
            text={hadith.text}
            grades={hadith.grades || []}
          />
        ))}
      </div>
    </div>
  );
}
