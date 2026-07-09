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
        // Try fetching book-specific section directly first (e.g. 5KB - 300KB instead of 20MB)
        const res = await fetch(`${BASE_URL}/eng-${collection}/sections/${bookNumber}.min.json`, { cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          return {
            metadata: data.metadata,
            hadiths: data.hadiths,
          };
        }

        const resFallback = await fetch(`${BASE_URL}/eng-${collection}/sections/${bookNumber}.json`, { cache: 'force-cache' });
        if (resFallback.ok) {
          const data = await resFallback.json();
          return {
            metadata: data.metadata,
            hadiths: data.hadiths,
          };
        }

        // Ultimate fallback to loading full collection if section endpoint fails
        const fullRes = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
        if (!fullRes.ok) throw new Error(`Failed to fetch ${collection} book ${bookNumber}`);
        const data = await fullRes.json();
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
  const counts: Record<string, number> = {
    bukhari: 7563,
    muslim: 7563,
    abudawud: 5274,
    tirmidhi: 3956,
    nasai: 5758,
    ibnmajah: 4341
  };
  const total = counts[collection] || 4000;
  const randomNo = Math.floor(Math.random() * total) + 1;

  try {
    const res = await fetch(`${BASE_URL}/eng-${collection}/${randomNo}.min.json`, { cache: 'force-cache' });
    if (res.ok) {
      const data = await res.json();
      return {
        metadata: { name: `Sahih al-${collection}` },
        hadith: data,
      };
    }
  } catch {}

  // Fallback to full collection
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
        // Try fetching single hadith directly first (e.g. 1KB instead of 20MB)
        const res = await fetch(`${BASE_URL}/eng-${collection}/${hadithNumber}.min.json`, { cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          return {
            metadata: {},
            hadith: data,
          };
        }

        const resFallback = await fetch(`${BASE_URL}/eng-${collection}/${hadithNumber}.json`, { cache: 'force-cache' });
        if (resFallback.ok) {
          const data = await resFallback.json();
          return {
            metadata: {},
            hadith: data,
          };
        }

        // Ultimate fallback to loading full collection
        const fullRes = await fetch(`${BASE_URL}/eng-${collection}.json`, { cache: 'force-cache' });
        if (!fullRes.ok) throw new Error('Failed to fetch single hadith');
        
        const data = await fullRes.json();
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
