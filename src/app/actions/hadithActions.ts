'use server';

// We'll use the fawazahmed0 hadith-api for data fetching
// Base URL: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions

const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

export async function fetchHadithCollections() {
  try {
    const res = await fetch(`${BASE_URL}/ara-bukhari.json`);
    if (!res.ok) throw new Error('Failed to fetch hadith metadata');
    const data = await res.json();
    return data.metadata;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchHadithsByCollection(collection: string, limit = 20) {
  try {
    // Note: The API structure typically returns the entire collection, which can be large.
    // For this prototype, we'll fetch the English translation and slice it.
    const res = await fetch(`${BASE_URL}/eng-${collection}.json`);
    if (!res.ok) throw new Error(`Failed to fetch ${collection}`);
    
    const data = await res.json();
    
    // Return metadata and a sliced portion of the hadiths to avoid massive payloads
    return {
      metadata: data.metadata,
      hadiths: data.hadiths.slice(0, limit),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchRandomHadith(collection: string = 'bukhari') {
  try {
    const res = await fetch(`${BASE_URL}/eng-${collection}.json`);
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
  try {
    const res = await fetch(`${BASE_URL}/eng-${collection}.json`);
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
}

