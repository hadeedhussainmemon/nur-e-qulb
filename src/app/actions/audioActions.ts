// EveryAyah URL structure: https://everyayah.com/data/{reciterIdentifier}/{surahNumber}{ayahNumber}.mp3
// Surah and Ayah numbers must be 3 digits (e.g., 001001 for Surah 1, Ayah 1)

export interface Reciter {
  identifier: string;
  name: string;
  style: string;
}

export const RECITERS: Reciter[] = [
  { identifier: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy', style: 'Murattal' },
  { identifier: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit', style: 'Murattal' },
  { identifier: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary', style: 'Murattal' },
  { identifier: 'Minshawy_Murattal_128kbps', name: 'Mohamed Siddiq El-Minshawi', style: 'Murattal' },
];

export async function getAyahAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number) {
  const paddedSurah = String(surahNumber).padStart(3, '0');
  const paddedAyah = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciterId}/${paddedSurah}${paddedAyah}.mp3`;
}

