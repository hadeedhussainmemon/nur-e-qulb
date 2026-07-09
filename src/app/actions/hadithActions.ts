'use server';

import { unstable_cache } from 'next/cache';

const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

export async function fetchHadithCollections() {
  return unstable_cache(
    async () => {
      try {
        const res = await fetch(`${BASE_URL}/ara-bukhari.json`, { cache: 'force-cache' });
        if (!res.ok) throw new Error('Failed to fetch hadith metadata');
        const data = await res.json();
        return data.metadata;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ['hadith-collections'],
    { revalidate: 86400 }
  )();
}

export async function fetchHadithsByCollection(collection: string, limit = 20) {
  return unstable_cache(
    async () => {
      try {
        const res = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Failed to fetch ${collection}`);
        
        const data = await res.json();
        
        return {
          metadata: data.metadata,
          hadiths: data.hadiths.slice(0, limit),
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ['hadiths-by-collection', collection, limit.toString()],
    { revalidate: 86400 }
  )();
}

export async function fetchHadithCategories(collection: string) {
  return unstable_cache(
    async () => {
      try {
        const res = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Failed to fetch categories for ${collection}`);
        
        const data = await res.json();
        
        return {
          metadata: data.metadata,
          sections: data.metadata.sections || data.metadata.section,
          sectionDetails: data.metadata.sectionDetails,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ['hadith-categories', collection],
    { revalidate: 86400 }
  )();
}

export async function fetchHadithsByCategory(collection: string, bookNumber: string) {
  return unstable_cache(
    async () => {
      try {
        const res = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Failed to fetch ${collection} book ${bookNumber}`);
        
        const data = await res.json();
        
        const filteredHadiths = data.hadiths.filter((h: any) => {
          let bNum = h.booknumber;
          if (bNum === undefined || bNum === null) {
            bNum = h.reference && h.reference.book;
          }
          return bNum !== undefined && bNum !== null && bNum.toString() === bookNumber.toString();
        });
     
        return {
          metadata: data.metadata,
          hadiths: filteredHadiths,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ['hadiths-by-category', collection, bookNumber.toString()],
    { revalidate: 86400 }
  )();
}

export async function fetchRandomHadith(collection: string = 'bukhari') {
  try {
    const res = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch random hadith');
    
    const data = await res.json();
    const hadiths = data.hadiths;
    const randomIndex = Math.floor(Math.random() * hadiths.length);
    
    return {
      metadata: data.metadata,
      hadith: hadiths[randomIndex],
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchSingleHadith(collection: string, hadithNumber: string) {
  return unstable_cache(
    async () => {
      try {
        const res = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
        if (!res.ok) throw new Error('Failed to fetch single hadith');
        
        const data = await res.json();
        const hadith = data.hadiths.find((h: any) => h.hadithnumber.toString() === hadithNumber.toString());
        
        return {
          metadata: data.metadata,
          hadith,
        };
      } catch (error) {
        console.error('Error fetching single hadith:', error);
        return null;
      }
    },
    ['single-hadith', collection, hadithNumber.toString()],
    { revalidate: 86400 }
  )();
}
