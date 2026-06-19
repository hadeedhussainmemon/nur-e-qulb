'use client';

import React from 'react';

interface TajweedTextProps {
  text: string;
}

export function TajweedText({ text }: TajweedTextProps) {
  // The ar.tajweed endpoint returns tags like: <tajweed class="idgham_ghunnah">text</tajweed>
  // We can render it safely (as it comes from a trusted API) and apply CSS styling to the classes.

  return (
    <div 
      className="tajweed-container text-3xl md:text-4xl leading-loose font-arabic text-slate-900 dark:text-slate-100 text-right" 
      style={{ fontFamily: 'Amiri, serif', lineHeight: '2.5' }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}
