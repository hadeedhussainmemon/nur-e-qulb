import { create } from 'zustand';

interface PWAState {
  deferredPrompt: any | null;
  isStandalone: boolean;
  setDeferredPrompt: (prompt: any | null) => void;
  setIsStandalone: (isStandalone: boolean) => void;
  triggerInstall: () => Promise<boolean>;
}

export const usePWAStore = create<PWAState>((set, get) => ({
  deferredPrompt: null,
  isStandalone: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsStandalone: (isStandalone) => set({ isStandalone }),
  triggerInstall: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) return false;
    
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        set({ deferredPrompt: null });
        return true;
      }
    } catch (err) {
      console.error('Error triggering PWA install:', err);
    }
    return false;
  }
}));
