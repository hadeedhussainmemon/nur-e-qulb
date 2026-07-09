
const BASE_URL = 'https://api.alquran.cloud/v1';

export async function fetchSurahList() {
  try {
    const res = await fetch(`${BASE_URL}/surah`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch surah list');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchSurahDetail(surahNumber: number) {
  try {
    // Fetch Arabic, Tajweed, English translation, and Urdu translation simultaneously
    const [arabicRes, tajweedRes, englishRes, urduRes] = await Promise.all([
      fetch(`${BASE_URL}/surah/${surahNumber}`, { cache: 'force-cache' }),
      fetch(`${BASE_URL}/surah/${surahNumber}/ar.tajweed`, { cache: 'force-cache' }),
      fetch(`${BASE_URL}/surah/${surahNumber}/en.asad`, { cache: 'force-cache' }),
      fetch(`${BASE_URL}/surah/${surahNumber}/ur.jalandhry`, { cache: 'force-cache' }),
    ]);

    if (!arabicRes.ok || !tajweedRes.ok || !englishRes.ok || !urduRes.ok) {
      throw new Error('Failed to fetch surah details');
    }

    const arabicData = await arabicRes.json();
    const tajweedData = await tajweedRes.json();
    const englishData = await englishRes.json();
    const urduData = await urduRes.json();

    return {
      arabic: arabicData.data,
      tajweed: tajweedData.data,
      english: englishData.data,
      urdu: urduData.data,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchRandomAyah() {
  try {
    const randomAyahNumber = Math.floor(Math.random() * 6236) + 1; // Total Ayahs in Quran
    const [arabicRes, englishRes] = await Promise.all([
      fetch(`${BASE_URL}/ayah/${randomAyahNumber}`),
      fetch(`${BASE_URL}/ayah/${randomAyahNumber}/en.asad`),
    ]);

    if (!arabicRes.ok || !englishRes.ok) throw new Error('Failed to fetch random ayah');

    const arabicData = await arabicRes.json();
    const englishData = await englishRes.json();

    return {
      arabic: arabicData.data,
      english: englishData.data,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchAyahTafsir(surahNumber: number, ayahNumber: number): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/ar.jalalayn`, { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to fetch Tafsir');
    const data = await res.json();
    return data.data.text;
  } catch (error) {
    console.error('Error fetching Tafsir:', error);
    return 'Failed to load Tafsir. Please check your internet connection.';
  }
}

