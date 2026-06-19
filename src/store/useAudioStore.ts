import { create } from 'zustand';
import { SURAHS } from '@/components/quran/QuranNavigator';

interface PlaylistTrack {
  surah: number;
  ayah: number;
}

interface AudioState {
  isPlaying: boolean;
  currentSurah: number | null;
  currentAyah: number | null;
  reciterId: string;
  playbackSpeed: number;
  playlist: PlaylistTrack[];
  playlistIndex: number;
  setPlaying: (playing: boolean) => void;
  playAyah: (surah: number, ayah: number, reciter?: string) => void;
  setReciter: (reciterId: string) => void;
  setSpeed: (speed: number) => void;
  nextAyah: () => void;
  prevAyah: () => void;
  stopAudio: () => void;
  addToPlaylist: (surah: number, ayah: number) => void;
  addSurahToPlaylist: (surahNum: number) => void;
  clearPlaylist: () => void;
  playPlaylist: (index?: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentSurah: null,
  currentAyah: null,
  reciterId: 'Alafasy_128kbps',
  playbackSpeed: 1,
  playlist: [],
  playlistIndex: -1,

  setPlaying: (playing) => set({ isPlaying: playing }),
  
  playAyah: (surah, ayah, reciter) => set((state) => ({
    isPlaying: true,
    currentSurah: surah,
    currentAyah: ayah,
    reciterId: reciter || state.reciterId,
    playlistIndex: -1, // Reset queue index if playing standard
  })),

  setReciter: (reciterId) => set({ reciterId }),
  
  setSpeed: (speed) => set({ playbackSpeed: speed }),

  addToPlaylist: (surah, ayah) => set((state) => ({
    playlist: [...state.playlist, { surah, ayah }]
  })),

  addSurahToPlaylist: (surahNum) => {
    const surah = SURAHS.find(s => s.number === surahNum);
    if (!surah) return;
    const tracks: PlaylistTrack[] = Array.from({ length: surah.ayahs }, (_, i) => ({
      surah: surahNum,
      ayah: i + 1
    }));
    set((state) => ({
      playlist: [...state.playlist, ...tracks]
    }));
  },

  clearPlaylist: () => set({ playlist: [], playlistIndex: -1 }),

  playPlaylist: (index = 0) => {
    const { playlist } = get();
    if (playlist.length === 0) return;
    const activeIndex = Math.max(0, Math.min(index, playlist.length - 1));
    const track = playlist[activeIndex];
    set({
      isPlaying: true,
      playlistIndex: activeIndex,
      currentSurah: track.surah,
      currentAyah: track.ayah
    });
  },

  nextAyah: () => {
    const { currentSurah, currentAyah, playlist, playlistIndex } = get();
    
    // 1. If playlist is active
    if (playlist.length > 0 && playlistIndex > -1) {
      const nextIndex = playlistIndex + 1;
      if (nextIndex < playlist.length) {
        const track = playlist[nextIndex];
        set({
          playlistIndex: nextIndex,
          currentSurah: track.surah,
          currentAyah: track.ayah,
          isPlaying: true
        });
      } else {
        // Queue finished
        set({ isPlaying: false, playlistIndex: -1 });
      }
      return;
    }

    // 2. Normal sequential play
    if (currentSurah && currentAyah) {
      const surahInfo = SURAHS.find(s => s.number === currentSurah);
      if (!surahInfo) return;

      if (currentAyah < surahInfo.ayahs) {
        set({ currentAyah: currentAyah + 1 });
      } else {
        // Last ayah of Surah, transition to next Surah if not Surah Nas
        if (currentSurah < 114) {
          set({
            currentSurah: currentSurah + 1,
            currentAyah: 1
          });
        } else {
          // Finished whole Quran!
          set({ isPlaying: false });
        }
      }
    }
  },

  prevAyah: () => {
    const { currentSurah, currentAyah, playlist, playlistIndex } = get();

    // 1. If playlist is active
    if (playlist.length > 0 && playlistIndex > 0) {
      const prevIndex = playlistIndex - 1;
      const track = playlist[prevIndex];
      set({
        playlistIndex: prevIndex,
        currentSurah: track.surah,
        currentAyah: track.ayah,
        isPlaying: true
      });
      return;
    }

    // 2. Normal sequential backward play
    if (currentSurah && currentAyah) {
      if (currentAyah > 1) {
        set({ currentAyah: currentAyah - 1 });
      } else {
        // Transition to previous Surah's last ayah if not Fatihah
        if (currentSurah > 1) {
          const prevSurahNum = currentSurah - 1;
          const prevSurahInfo = SURAHS.find(s => s.number === prevSurahNum);
          if (prevSurahInfo) {
            set({
              currentSurah: prevSurahNum,
              currentAyah: prevSurahInfo.ayahs
            });
          }
        }
      }
    }
  },

  stopAudio: () => set({ isPlaying: false }),
}));
